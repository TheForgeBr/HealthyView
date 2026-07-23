import express from 'express';
import { createUser } from '../controllers/userController';

const router = express.Router();
router.post('/user/create', (req, res) => {
    createUser(req,res);
});

export default router;