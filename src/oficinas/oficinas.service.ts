import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Oficina } from '../entities/oficina.entity';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

// DTOs
export class CreateOficinaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateOficinaDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

// Service
@Injectable()
export class OficinasService {
  constructor(
    @InjectRepository(Oficina)
    private oficinaRepository: Repository<Oficina>,
  ) {}

  async create(createOficinaDto: CreateOficinaDto): Promise<Oficina> {
    const oficina = this.oficinaRepository.create(createOficinaDto);
    return await this.oficinaRepository.save(oficina);
  }

  async findAll(activo?: boolean): Promise<Oficina[]> {
    const where: any = {};
    if (activo !== undefined) {
      where.activo = activo;
    }
    return await this.oficinaRepository.find({ where, order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<Oficina> {
    const oficina = await this.oficinaRepository.findOne({ where: { id } });
    if (!oficina) {
      throw new NotFoundException(`Oficina con ID ${id} no encontrada`);
    }
    return oficina;
  }

  async update(id: string, updateOficinaDto: UpdateOficinaDto): Promise<Oficina> {
    await this.findOne(id);
    await this.oficinaRepository.update(id, updateOficinaDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const oficina = await this.findOne(id);
    await this.oficinaRepository.remove(oficina);
    return { message: 'Oficina eliminada exitosamente' };
  }
}
