import { Injectable, NotFoundException, Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, Module } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsInt, MaxLength, Min } from 'class-validator';
import { TipoCita } from '../entities/tipo-cita.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { AuthModule } from '../auth/auth.module';

// DTOs
export class CreateTipoCitaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  duracionEstimadaMinutos?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateTipoCitaDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  duracionEstimadaMinutos?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

// Service
@Injectable()
export class TiposCitaService {
  constructor(
    @InjectRepository(TipoCita)
    private tipoCitaRepository: Repository<TipoCita>,
  ) {}

  async create(createTipoCitaDto: CreateTipoCitaDto): Promise<TipoCita> {
    const tipoCita = this.tipoCitaRepository.create(createTipoCitaDto);
    return await this.tipoCitaRepository.save(tipoCita);
  }

  async findAll(activo?: boolean): Promise<TipoCita[]> {
    const where: any = {};
    if (activo !== undefined) {
      where.activo = activo;
    }
    return await this.tipoCitaRepository.find({ where, order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<TipoCita> {
    const tipoCita = await this.tipoCitaRepository.findOne({ where: { id } });
    if (!tipoCita) {
      throw new NotFoundException(`Tipo de cita con ID ${id} no encontrado`);
    }
    return tipoCita;
  }

  async update(id: string, updateTipoCitaDto: UpdateTipoCitaDto): Promise<TipoCita> {
    await this.findOne(id);
    await this.tipoCitaRepository.update(id, updateTipoCitaDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const tipoCita = await this.findOne(id);
    await this.tipoCitaRepository.remove(tipoCita);
    return { message: 'Tipo de cita eliminado exitosamente' };
  }
}

// Controller
@Controller('tipos-cita')
@UseGuards(JwtAuthGuard)
export class TiposCitaController {
  constructor(private readonly tiposCitaService: TiposCitaService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() createTipoCitaDto: CreateTipoCitaDto): Promise<TipoCita> {
    return this.tiposCitaService.create(createTipoCitaDto);
  }

  @Get()
  async findAll(@Query('activo') activo?: string): Promise<TipoCita[]> {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.tiposCitaService.findAll(activoBool);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TipoCita> {
    return this.tiposCitaService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateTipoCitaDto: UpdateTipoCitaDto): Promise<TipoCita> {
    return this.tiposCitaService.update(id, updateTipoCitaDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.tiposCitaService.remove(id);
  }
}

// Module
@Module({
  imports: [TypeOrmModule.forFeature([TipoCita]), AuthModule],
  controllers: [TiposCitaController],
  providers: [TiposCitaService],
  exports: [TiposCitaService],
})
export class TiposCitaModule {}
