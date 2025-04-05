import { ReparadorRepository } from '../repositories/ReparadorRepository';

export class ReparadorService {
    private reparadorRepository: ReparadorRepository;

    constructor() {
        this.reparadorRepository = new ReparadorRepository();
    }

    public async createReparador(data: any): Promise<any> {
        // Implement the logic to create a reparador
        const reparador = await this.reparadorRepository.create(data);
        return reparador;
    }

    public async getReparadorById(id: string): Promise<any> {
        // Implement the logic to get a reparador by ID
        const reparador = await this.reparadorRepository.findById(id);
        return reparador;
    }

    public async updateReparador(id: string, data: any): Promise<any> {
        // Implement the logic to update a reparador
        const updatedReparador = await this.reparadorRepository.update(id, data);
        return updatedReparador;
    }

    public async deleteReparador(id: string): Promise<void> {
        // Implement the logic to delete a reparador
        await this.reparadorRepository.delete(id);
    }
}