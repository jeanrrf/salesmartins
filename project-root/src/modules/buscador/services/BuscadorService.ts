import { BuscadorRepository } from '../repositories/BuscadorRepository';

export class BuscadorService {
    private buscadorRepository: BuscadorRepository;

    constructor() {
        this.buscadorRepository = new BuscadorRepository();
    }

    public async buscarProduto(id: string) {
        return await this.buscadorRepository.encontrarPorId(id);
    }

    public async listarProdutos() {
        return await this.buscadorRepository.listarTodos();
    }

    public async criarProduto(produto: any) {
        return await this.buscadorRepository.salvar(produto);
    }
}