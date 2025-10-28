import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Cliente } from '../entities/cliente.entity';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  async create(@Body() createClienteDto: CreateClienteDto): Promise<Cliente> {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  async findAll(@Query('busqueda') busqueda?: string): Promise<Cliente[]> {
    return this.clientesService.findAll(busqueda);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Cliente> {
    return this.clientesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.clientesService.remove(id);
  }
}
