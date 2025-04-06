import { ReparadorRepository } from '../repositories/ReparadorRepository';

export class ReparadorService {
    private reparadorRepository: ReparadorRepository;

    constructor() {
        this.reparadorRepository = new ReparadorRepository();
    }

    public async create(data: any): Promise<any> {
        // Implement the logic to create a reparador
        const reparador = await this.reparadorRepository.create(data);
        return reparador;
    }

    public async getAll(): Promise<any[]> {
        // Implement the logic to get all reparadores
        return await this.reparadorRepository.findAll();
    }

    public async getById(id: string): Promise<any> {
        // Implement the logic to get a reparador by ID
        return await this.reparadorRepository.findById(Number(id));
    }

    public async update(id: string, data: any): Promise<any> {
        // Implement the logic to update a reparador
        return await this.reparadorRepository.update(Number(id), data);
    }

    public async delete(id: string): Promise<void> {
        // Implement the logic to delete a reparador
        await this.reparadorRepository.delete(Number(id));
    }
}