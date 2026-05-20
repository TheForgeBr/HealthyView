import { Request, Response } from "express";

export const teste = (req: Request, res: Response) => {
    res.json({ message: "Teste endpoint funcionando!" });
}