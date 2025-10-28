import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const cliente = this.clienteRepository.create(createClienteDto);
    return await this.clienteRepository.save(cliente);
  }

  async findAll(busqueda?: string): Promise<Cliente[]> {
    if (busqueda) {
      return await this.clienteRepository.find({
        where: [
          { nombreCompleto: Like(`%${busqueda}%`) },
          { email: Like(`%${busqueda}%`) },
          { telefono: Like(`%${busqueda}%`) },
        ],
        order: { nombreCompleto: 'ASC' },
      });
    }

    return await this.clienteRepository.find({
      order: { nombreCompleto: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id },
      relations: ['citas'],
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  async update(id: string, updateClienteDto: UpdateClienteDto): Promise<Cliente> {
    await this.findOne(id);
    await this.clienteRepository.update(id, updateClienteDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const cliente = await this.findOne(id);
    await this.clienteRepository.remove(cliente);
    return { message: 'Cliente eliminado exitosamente' };
  }
}
