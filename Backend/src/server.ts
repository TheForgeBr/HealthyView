import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import { testConnection } from './services/supabaseService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', userRoutes);

async function startServer() {
  try {
    // Testar conexão com Supabase
    const connected = await testConnection();

    if (!connected) {
      console.warn(
        '⚠️ Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente.'
      );
    }

    app.listen(PORT, () => {
        console.log("Deu bom!!!")
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();