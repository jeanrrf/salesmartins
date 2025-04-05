import { getConnection } from 'typeorm';
import { Reparador } from '../entities/Reparador';

export class ReparadorRepository {
    async create(reparadorData: Partial<Reparador>): Promise<Reparador> {
        const connection = getConnection();
        const reparador = connection.manager.create(Reparador, reparadorData);
        return await connection.manager.save(reparador);
    }

    async findById(id: number): Promise<Reparador | undefined> {
        const connection = getConnection();
        return await connection.manager.findOne(Reparador, id);
    }

    async findAll(): Promise<Reparador[]> {
        const connection = getConnection();
        return await connection.manager.find(Reparador);
    }

    async update(id: number, reparadorData: Partial<Reparador>): Promise<Reparador | undefined> {
        const connection = getConnection();
        await connection.manager.update(Reparador, id, reparadorData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        const connection = getConnection();
        await connection.manager.delete(Reparador, id);
    }
}