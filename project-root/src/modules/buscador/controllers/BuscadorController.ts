import { Request, Response } from 'express';
import BuscadorService from '../services/BuscadorService';

class BuscadorController {
    private buscadorService: BuscadorService;

    constructor() {
        this.buscadorService = new BuscadorService();
    }

    public async buscar(req: Request, res: Response): Promise<Response> {
        try {
            const resultados = await this.buscadorService.buscar(req.query);
            return res.status(200).json(resultados);
        } catch (error) {
            return res.status(500).json({ message: 'Erro ao buscar', error });
        }
    }

    public async criar(req: Request, res: Response): Promise<Response> {
        try {
            const novoProduto = await this.buscadorService.criar(req.body);
            return res.status(201).json(novoProduto);
        } catch (error) {
            return res.status(500).json({ message: 'Erro ao criar produto', error });
        }
    }
}

export default BuscadorController;