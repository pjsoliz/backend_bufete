import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Abogado } from '../entities/abogado.entity';
import { CreateAbogadoDto, UpdateAbogadoDto } from './dto/abogado.dto';

@Injectable()
export class AbogadosService {
  constructor(
    @InjectRepository(Abogado)
    private abogadoRepository: Repository<Abogado>,
  ) {}

  async create(createAbogadoDto: CreateAbogadoDto): Promise<Abogado> {
    const abogado = this.abogadoRepository.create(createAbogadoDto);
    return await this.abogadoRepository.save(abogado);
  }

  async findAll(activo?: boolean, busqueda?: string): Promise<Abogado[]> {
    const where: any = {};

    if (activo !== undefined) {
      where.activo = activo;
    }

    if (busqueda) {
      return await this.abogadoRepository.find({
        where: [
          { ...where, nombre: Like(`%${busqueda}%`) },
          { ...where, especialidad: Like(`%${busqueda}%`) },
        ],
        relations: ['oficina'],
        order: { nombre: 'ASC' },
      });
    }

    return await this.abogadoRepository.find({
      where,
      relations: ['oficina'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Abogado> {
    const abogado = await this.abogadoRepository.findOne({
      where: { id },
      relations: ['oficina', 'citas'],
    });

    if (!abogado) {
      throw new NotFoundException(`Abogado con ID ${id} no encontrado`);
    }

    return abogado;
  }

  async update(id: string, updateAbogadoDto: UpdateAbogadoDto): Promise<Abogado> {
    await this.findOne(id);
    await this.abogadoRepository.update(id, updateAbogadoDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const abogado = await this.findOne(id);
    await this.abogadoRepository.remove(abogado);
    return { message: 'Abogado eliminado exitosamente' };
  }
}
