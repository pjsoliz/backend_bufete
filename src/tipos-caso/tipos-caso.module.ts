import { Injectable, NotFoundException, Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, Module } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { TipoCaso } from '../entities/tipo-caso.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { AuthModule } from '../auth/auth.module';

// DTOs
export class CreateTipoCasoDto {
  @IsUUID('4')
  @IsNotEmpty()
  areaDerechoId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateTipoCasoDto {
  @IsUUID('4')
  @IsOptional()
  areaDerechoId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

// Service
@Injectable()
export class TiposCasoService {
  constructor(
    @InjectRepository(TipoCaso)
    private tipoCasoRepository: Repository<TipoCaso>,
  ) {}

  async create(createTipoCasoDto: CreateTipoCasoDto): Promise<TipoCaso> {
    const tipoCaso = this.tipoCasoRepository.create(createTipoCasoDto);
    return await this.tipoCasoRepository.save(tipoCaso);
  }

  async findAll(areaDerechoId?: string, activo?: boolean): Promise<TipoCaso[]> {
    const where: any = {};
    if (areaDerechoId) {
      where.areaDerechoId = areaDerechoId;
    }
    if (activo !== undefined) {
      where.activo = activo;
    }
    return await this.tipoCasoRepository.find({
      where,
      relations: ['areaDerecho'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<TipoCaso> {
    const tipoCaso = await this.tipoCasoRepository.findOne({
      where: { id },
      relations: ['areaDerecho'],
    });
    if (!tipoCaso) {
      throw new NotFoundException(`Tipo de caso con ID ${id} no encontrado`);
    }
    return tipoCaso;
  }

  async update(id: string, updateTipoCasoDto: UpdateTipoCasoDto): Promise<TipoCaso> {
    await this.findOne(id);
    await this.tipoCasoRepository.update(id, updateTipoCasoDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const tipoCaso = await this.findOne(id);
    await this.tipoCasoRepository.remove(tipoCaso);
    return { message: 'Tipo de caso eliminado exitosamente' };
  }
}

// Controller
@Controller('tipos-caso')
@UseGuards(JwtAuthGuard)
export class TiposCasoController {
  constructor(private readonly tiposCasoService: TiposCasoService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() createTipoCasoDto: CreateTipoCasoDto): Promise<TipoCaso> {
    return this.tiposCasoService.create(createTipoCasoDto);
  }

  @Get()
  async findAll(
    @Query('areaDerechoId') areaDerechoId?: string,
    @Query('activo') activo?: string,
  ): Promise<TipoCaso[]> {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.tiposCasoService.findAll(areaDerechoId, activoBool);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TipoCaso> {
    return this.tiposCasoService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateTipoCasoDto: UpdateTipoCasoDto): Promise<TipoCaso> {
    return this.tiposCasoService.update(id, updateTipoCasoDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.tiposCasoService.remove(id);
  }
}

// Module
@Module({
  imports: [TypeOrmModule.forFeature([TipoCaso]), AuthModule],
  controllers: [TiposCasoController],
  providers: [TiposCasoService],
  exports: [TiposCasoService],
})
export class TiposCasoModule {}
