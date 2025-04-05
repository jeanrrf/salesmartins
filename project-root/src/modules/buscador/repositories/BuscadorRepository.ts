import { getRepository } from 'typeorm';
import { Buscador } from '../entities/Buscador';

export class BuscadorRepository {
    private repository = getRepository(Buscador);

    public async findAll(): Promise<Buscador[]> {
        return await this.repository.find();
    }

    public async findById(id: number): Promise<Buscador | undefined> {
        return await this.repository.findOne(id);
    }

    public async create(data: Partial<Buscador>): Promise<Buscador> {
        const buscador = this.repository.create(data);
        return await this.repository.save(buscador);
    }

    public async update(id: number, data: Partial<Buscador>): Promise<Buscador | undefined> {
        await this.repository.update(id, data);
        return this.findById(id);
    }

    public async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}