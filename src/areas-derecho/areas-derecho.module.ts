import { Injectable, NotFoundException, Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, Module } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { AreaDerecho } from '../entities/area-derecho.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { AuthModule } from '../auth/auth.module';

// DTOs
export class CreateAreaDerechoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateAreaDerechoDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

// Service
@Injectable()
export class AreasDerechoService {
  constructor(
    @InjectRepository(AreaDerecho)
    private areaDerechoRepository: Repository<AreaDerecho>,
  ) {}

  async create(createAreaDerechoDto: CreateAreaDerechoDto): Promise<AreaDerecho> {
    const area = this.areaDerechoRepository.create(createAreaDerechoDto);
    return await this.areaDerechoRepository.save(area);
  }

  async findAll(activo?: boolean): Promise<AreaDerecho[]> {
    const where: any = {};
    if (activo !== undefined) {
      where.activo = activo;
    }
    return await this.areaDerechoRepository.find({ where, order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<AreaDerecho> {
    const area = await this.areaDerechoRepository.findOne({ where: { id }, relations: ['tiposCaso'] });
    if (!area) {
      throw new NotFoundException(`Área de derecho con ID ${id} no encontrada`);
    }
    return area;
  }

  async update(id: string, updateAreaDerechoDto: UpdateAreaDerechoDto): Promise<AreaDerecho> {
    await this.findOne(id);
    await this.areaDerechoRepository.update(id, updateAreaDerechoDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const area = await this.findOne(id);
    await this.areaDerechoRepository.remove(area);
    return { message: 'Área de derecho eliminada exitosamente' };
  }
}

// Controller
@Controller('areas-derecho')
@UseGuards(JwtAuthGuard)
export class AreasDerechoController {
  constructor(private readonly areasDerechoService: AreasDerechoService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() createAreaDerechoDto: CreateAreaDerechoDto): Promise<AreaDerecho> {
    return this.areasDerechoService.create(createAreaDerechoDto);
  }

  @Get()
  async findAll(@Query('activo') activo?: string): Promise<AreaDerecho[]> {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.areasDerechoService.findAll(activoBool);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AreaDerecho> {
    return this.areasDerechoService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateAreaDerechoDto: UpdateAreaDerechoDto): Promise<AreaDerecho> {
    return this.areasDerechoService.update(id, updateAreaDerechoDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.areasDerechoService.remove(id);
  }
}

// Module
@Module({
  imports: [TypeOrmModule.forFeature([AreaDerecho]), AuthModule],
  controllers: [AreasDerechoController],
  providers: [AreasDerechoService],
  exports: [AreasDerechoService],
})
export class AreasDerechoModule {}
