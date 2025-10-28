import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CitasService } from './citas.service';
import { CreateCitaDto, UpdateCitaDto, UpdateEstadoCitaDto, FilterCitasDto, CreateCitaChatbotDto } from './dto/cita.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public, CurrentUser, Roles } from '../auth/decorators/auth.decorators';
import { Cita } from '../entities/cita.entity';

@Controller('citas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  // Endpoint PÚBLICO para que el chatbot (N8N) cree citas
  @Public()
  @Post('chatbot')
  @HttpCode(HttpStatus.CREATED)
  async createFromChatbot(@Body() createCitaDto: CreateCitaChatbotDto): Promise<Cita> {
    // Forzar origen como 'chatbot' y creadoPorUsuarioId como null
    const citaData = {
      ...createCitaDto,
      origen: 'chatbot' as const,
      creadoPorUsuarioId: null,
    };
    return this.citasService.create(citaData);
  }

  @Post()
  async create(
    @Body() createCitaDto: CreateCitaDto,
    @CurrentUser() user: any,
  ): Promise<Cita> {
    // Si se crea desde el panel, agregar el usuario creador
    if (!createCitaDto.creadoPorUsuarioId) {
      createCitaDto.creadoPorUsuarioId = user.id;
    }
    return this.citasService.create(createCitaDto);
  }

  @Get()
  async findAll(@Query() filterDto: FilterCitasDto): Promise<Cita[]> {
    return this.citasService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Cita> {
    return this.citasService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCitaDto: UpdateCitaDto,
  ): Promise<Cita> {
    return this.citasService.update(id, updateCitaDto);
  }

  @Patch(':id/estado')
  async updateEstado(
    @Param('id') id: string,
    @Body() updateEstadoDto: UpdateEstadoCitaDto,
    @CurrentUser() user: any,
  ): Promise<Cita> {
    return this.citasService.updateEstado(id, updateEstadoDto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.citasService.remove(id, user.id);
  }

  @Get('abogado/:id')
  async findByAbogado(@Param('id') abogadoId: string): Promise<Cita[]> {
    return this.citasService.findByAbogado(abogadoId);
  }

  @Get('cliente/:id')
  async findByCliente(@Param('id') clienteId: string): Promise<Cita[]> {
    return this.citasService.findByCliente(clienteId);
  }
}
