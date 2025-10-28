import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OficinasService, CreateOficinaDto, UpdateOficinaDto } from './oficinas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { Oficina } from '../entities/oficina.entity';
import { AuthModule } from '../auth/auth.module';

// Controller
@Controller('oficinas')
@UseGuards(JwtAuthGuard)
export class OficinasController {
  constructor(private readonly oficinasService: OficinasService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() createOficinaDto: CreateOficinaDto): Promise<Oficina> {
    return this.oficinasService.create(createOficinaDto);
  }

  @Get()
  async findAll(@Query('activo') activo?: string): Promise<Oficina[]> {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.oficinasService.findAll(activoBool);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Oficina> {
    return this.oficinasService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateOficinaDto: UpdateOficinaDto): Promise<Oficina> {
    return this.oficinasService.update(id, updateOficinaDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.oficinasService.remove(id);
  }
}

// Module
@Module({
  imports: [TypeOrmModule.forFeature([Oficina]), AuthModule],
  controllers: [OficinasController],
  providers: [OficinasService],
  exports: [OficinasService],
})
export class OficinasModule {}
