import { User } from './../types/User';
import {Request, Response} from 'express'
import supabase from '../services/supabaseService';

export async function createUser(req: Request, res:Response) {
    try {
        
        const bodydata = req.body as User;
        const response = await supabase.from('users').insert([bodydata]).select().single()

        console.log(response)

    } catch (error){
      console.log('Erro geral na criação de usuário', error);
      return res.status(500).json({error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido' }`})  
    }
}