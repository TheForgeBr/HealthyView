
# 🗄️ MedHistory — Lista de Tabelas do Banco de Dados (Supabase)

> Este documento resume a **camada de dados** do MedHistory, já alinhada à normalização proposta, ao uso do **Supabase Auth** e às decisões tomadas no chat (incluindo `especialidades` sem `descricao`).

## 🔑 Convenções e Integração com Auth
- `auth_user_id (uuid)` referencia `auth.users.id` (Supabase Auth).
- Em tabelas sensíveis, **RLS habilitado**.
- Chaves primárias (`id`) preferencialmente `uuid` com `gen_random_uuid()`.

---

## 1) Núcleo de Pessoas

### 1.1 `users`
Perfil detalhado do usuário/paciente (dados pessoais e de saúde básica).

| Coluna                | Tipo       | Restrições / Observações |
|-----------------------|------------|---------------------------|
| id                    | uuid       | **PK**                    |
| auth_user_id          | uuid       | **FK → auth.users.id** (opcional para perfis criados por médico) |
| nome_completo         | text       | NOT NULL                  |
| nome_social           | text       |                           |
| genero                | text       | Ex.: *homem_cis, mulher_trans, outros* |
| genero_outro          | text       | Livre quando `genero = outros` |
| data_nascimento       | date       |                           |
| celular               | text       |                           |
| email                 | text       |                           |
| pai_user_id           | uuid       | **FK → users.id** (opcional) |
| pai_nome              | text       | Caso não exista `pai_user_id` |
| mae_user_id           | uuid       | **FK → users.id** (opcional) |
| mae_nome              | text       | Caso não exista `mae_user_id` |
| profissao             | text       |                           |
| escolaridade          | text       |                           |
| endereco_id           | uuid       | **FK → enderecos.id**     |
| cpf                   | text       | UNIQUE                    |
| rg                    | text       |                           |
| orgao_emissor         | text       |                           |
| uf_emissor            | text       |                           |
| data_emissao          | date       |                           |
| nacionalidade         | text       |                           |
| tipo_sanguineo        | text       |                           |
| foto_url              | text       | (Storage)                 |
| altura_cm             | numeric    |                           |
| peso_kg               | numeric    |                           |
| estado_civil          | text       |                           |
| created_at            | timestamptz| default now()             |

> **Observação**: pai/mãe podem ser **relacionados** (FK) ou apenas **nomes livres**, cobrindo o requisito “se existir relacionar, senão armazenar o nome”.

### 1.2 `enderecos`
Endereço normalizado (pode ser usado por `users` e `estabelecimentos_saude`).

| Coluna      | Tipo | Observações |
|-------------|------|-------------|
| id          | uuid | **PK**      |
| cep         | text |             |
| estado      | text | UF          |
| cidade      | text |             |
| bairro      | text |             |
| complemento | text |             |

---

## 2) Dicionários / Catálogos

### 2.1 `especialidades`
Lista mestra de especialidades médicas (sem `descricao`).

| Coluna     | Tipo        | Observações      |
|------------|-------------|------------------|
| id         | uuid        | **PK**           |
| nome       | text        | **UNIQUE**, NOT NULL |
| created_at | timestamptz | default now()    |

---

## 3) Médicos e Formação

### 3.1 `medicos`
Extensão profissional vinculada a um `users` (médico). **Visibilidade restrita** (RLS).

| Coluna                 | Tipo | Observações |
|------------------------|------|-------------|
| id                     | uuid | **PK**      |
| user_id                | uuid | **FK → users.id**, **UNIQUE** (1:1) |
| crm                    | text | **UNIQUE**, NOT NULL |
| email_profissional     | text |             |
| estado_civil           | text |             |
| pertence_equipe        | boolean | checkbox  |
| nome_equipe            | text | se `pertence_equipe = true` |
| membro_retaguarda      | boolean | checkbox  |
| nome_equipe_retaguarda | text | se `membro_retaguarda = true` |
| created_at             | timestamptz | default now() |

### 3.2 `medico_especialidade`
M:N entre médicos e especialidades, com detalhes por médico.

| Coluna          | Tipo | Observações |
|-----------------|------|-------------|
| id              | uuid | **PK**      |
| medico_id       | uuid | **FK → medicos.id** |
| especialidade_id| uuid | **FK → especialidades.id** |
| ano_conclusao   | int  |             |
| instituicao     | text |             |

### 3.3 `medico_formacao`
Formações acadêmicas (graduação, residência, mestrado, doutorado, livre-docência).

| Coluna         | Tipo | Observações |
|----------------|------|-------------|
| id             | uuid | **PK**      |
| medico_id      | uuid | **FK → medicos.id** |
| tipo_formacao  | text | ex.: `graduacao`, `residencia`, `mestrado`, `doutorado`, `livre_docencia` |
| instituicao    | text | **para graduação: NOT NULL** |
| ano_conclusao  | int  |             |
| local          | text | hospital (p/ residência), opcional |

### 3.4 `medico_estabelecimento`
Histórico de clínicas/estabelecimentos em que o médico atuou.

| Coluna               | Tipo | Observações |
|----------------------|------|-------------|
| id                   | uuid | **PK**      |
| medico_id            | uuid | **FK → medicos.id** |
| estabelecimento_id   | uuid | **FK → estabelecimentos_saude.id** |
| data_inicio          | date |             |
| data_fim             | date |             |

---

## 4) Estabelecimentos de Saúde (Clínicas / Hospitais)

### 4.1 `estabelecimentos_saude`
Cadastro de unidades (integração futura com **CNES**).

| Coluna        | Tipo | Observações |
|---------------|------|-------------|
| id            | uuid | **PK**      |
| cnes          | text | **UNIQUE**, NOT NULL |
| cnpj          | text | opcional, se aplicável |
| nome          | text | NOT NULL    |
| endereco_id   | uuid | **FK → enderecos.id** |
| created_at    | timestamptz | default now() |

---

## 5) Registros Clínicos (Histórico, Exames, Documentos)

### 5.1 `historico_medico`
Eventos clínicos do usuário (consulta / atendimento) — **visão consolidada**.

| Coluna               | Tipo        | Observações |
|----------------------|-------------|-------------|
| id                   | uuid        | **PK**      |
| usuario_id           | uuid        | **FK → users.id** |
| medico_id            | uuid        | **FK → medicos.id** |
| especialidade_id     | uuid        | **FK → especialidades.id** |
| estabelecimento_id   | uuid        | **FK → estabelecimentos_saude.id**, opcional |
| data_consulta        | date        |             |
| laudo                | text        | opcional    |
| receita              | text        | opcional    |
| observacoes          | text        | opcional    |
| exame_resumo         | text        | opcional (descrição breve) |
| doc_link             | text        | link (Storage) |
| created_at           | timestamptz | default now() |

### 5.2 `exames_laudos`
Arquivos de exames/laudos **vinculados ao usuário** e ao **médico solicitante**.

| Coluna           | Tipo        | Observações |
|------------------|-------------|-------------|
| id               | uuid        | **PK**      |
| usuario_id       | uuid        | **FK → users.id** |
| medico_id        | uuid        | **FK → medicos.id** |
| data_atendimento | date        |             |
| file_link        | text        | link (Storage) |
| created_at       | timestamptz | default now() |

---

## 6) Saúde do Usuário — Listas Normalizadas (1:N)

> Em vez de arrays no `users`, usamos tabelas auxiliares (1:N) para manter a normalização e permitir histórico/consulta eficientes.

### 6.1 `user_alergias`
| Coluna     | Tipo | Observações |
|------------|------|-------------|
| id         | uuid | **PK**      |
| user_id    | uuid | **FK → users.id** |
| alergia    | text | NOT NULL    |

### 6.2 `user_deficiencias`
| Coluna     | Tipo | Observações |
|------------|------|-------------|
| id         | uuid | **PK**      |
| user_id    | uuid | **FK → users.id** |
| deficiencia| text | NOT NULL    |

### 6.3 `user_fatores_risco`
| Coluna   | Tipo | Observações |
|----------|------|-------------|
| id       | uuid | **PK**      |
| user_id  | uuid | **FK → users.id** |
| fator    | text | NOT NULL    |

### 6.4 `user_comorbidades`
| Coluna     | Tipo | Observações |
|------------|------|-------------|
| id         | uuid | **PK**      |
| user_id    | uuid | **FK → users.id** |
| condicao   | text | NOT NULL    |

### 6.5 `user_medicamentos`
| Coluna        | Tipo   | Observações |
|---------------|--------|-------------|
| id            | uuid   | **PK**      |
| user_id       | uuid   | **FK → users.id** |
| medicamento   | text   | NOT NULL    |
| dose          | text   | opcional    |
| frequencia    | text   | opcional    |
| uso_continuo  | boolean| default true |

### 6.6 `user_vacinacoes`
| Coluna   | Tipo | Observações |
|----------|------|-------------|
| id       | uuid | **PK**      |
| user_id  | uuid | **FK → users.id** |
| vacina   | text | NOT NULL    |
| data     | date | opcional    |

### 6.7 `user_alertas`
| Coluna   | Tipo | Observações |
|----------|------|-------------|
| id       | uuid | **PK**      |
| user_id  | uuid | **FK → users.id** |
| alerta   | text | NOT NULL    |

---

## 7) (Opcional) Tabelas Derivadas / Auditoria
- **auditoria_acesso** (se necessário): registrar leituras/escritas em dados de saúde.
- **logs_api**: acessos à API, IP, rota, status code, latência, `auth_user_id`.

---

## 🔐 RLS — Diretrizes Gerais
- `users`, `medicos`, `historico_medico`, `exames_laudos`, e tabelas 6.x: **ENABLE ROW LEVEL SECURITY**.
- Políticas típicas:
  - **Pacientes**: podem `SELECT`/`UPDATE` **apenas** seus próprios registros (`auth.uid() = users.auth_user_id`).
  - **Médicos**: podem `SELECT`/`INSERT` em `historico_medico` **somente** nos atendimentos em que são responsáveis.
  - `especialidades`: leitura pública (`USING (true)`), escrita restrita a administradores.

---

## 🧭 Relações (resumo)
- `users` → `enderecos` (N:1)  
- `medicos` → `users` (1:1)  
- `medico_especialidade` → (`medicos`, `especialidades`) (N:M)  
- `medico_formacao` → `medicos` (1:N)  
- `medico_estabelecimento` → (`medicos`, `estabelecimentos_saude`) (N:M temporal)  
- `historico_medico` → (`users`, `medicos`, `especialidades`, `estabelecimentos_saude`)  
- `exames_laudos` → (`users`, `medicos`)  
- Tabelas 6.x → `users` (1:N)

---
