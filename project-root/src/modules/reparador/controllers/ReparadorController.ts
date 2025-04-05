import { Router, Request, Response } from 'express';
import { ReparadorService } from '../services/ReparadorService';

class ReparadorController {
    private reparadorService: ReparadorService;
    private router: Router;

    constructor() {
        this.reparadorService = new ReparadorService();
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post('/', this.create.bind(this));
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
    }

    public getRouter(): Router {
        return this.router;
    }

    public async create(req: Request, res: Response): Promise<Response> {
        try {
            const reparadorData = req.body;
            const newReparador = await this.reparadorService.create(reparadorData);
            return res.status(201).json(newReparador);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating reparador', error });
        }
    }

    public async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const reparadores = await this.reparadorService.getAll();
            return res.status(200).json(reparadores);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching reparadores', error });
        }
    }

    public async getById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const reparador = await this.reparadorService.getById(id);
            if (!reparador) {
                return res.status(404).json({ message: 'Reparador not found' });
            }
            return res.status(200).json(reparador);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching reparador', error });
        }
    }

    public async update(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const reparadorData = req.body;
            const updatedReparador = await this.reparadorService.update(id, reparadorData);
            if (!updatedReparador) {
                return res.status(404).json({ message: 'Reparador not found' });
            }
            return res.status(200).json(updatedReparador);
        } catch (error) {
            return res.status(500).json({ message: 'Error updating reparador', error });
        }
    }

    public async delete(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const deleted = await this.reparadorService.delete(id);
            if (!deleted) {
                return res.status(404).json({ message: 'Reparador not found' });
            }
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting reparador', error });
        }
    }
}

export default ReparadorController;