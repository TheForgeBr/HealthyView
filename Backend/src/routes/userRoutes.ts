import express from 'express';
import { teste } from '../controllers/userController';

const router = express.Router();

router.get('/teste', (req, res)=> {
    teste(req, res);
})

export default router;