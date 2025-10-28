import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AbogadosService } from './abogados.service';
import { CreateAbogadoDto, UpdateAbogadoDto } from './dto/abogado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { Abogado } from '../entities/abogado.entity';

@Controller('abogados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbogadosController {
  constructor(private readonly abogadosService: AbogadosService) {}

  @Post()
  @Roles('admin')
  async create(@Body() createAbogadoDto: CreateAbogadoDto): Promise<Abogado> {
    return this.abogadosService.create(createAbogadoDto);
  }

  @Get()
  async findAll(
    @Query('activo') activo?: string,
    @Query('busqueda') busqueda?: string,
  ): Promise<Abogado[]> {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.abogadosService.findAll(activoBool, busqueda);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Abogado> {
    return this.abogadosService.findOne(id);
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateAbogadoDto: UpdateAbogadoDto,
  ): Promise<Abogado> {
    return this.abogadosService.update(id, updateAbogadoDto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.abogadosService.remove(id);
  }
}
