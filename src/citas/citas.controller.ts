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
  // ============================================
  // 🆕 ENDPOINTS PARA EL AGENTE (n8n)
  // ============================================

  /**
   * Endpoint 1: Verificar si un cliente existe
   * Usado por n8n para saber si es cliente nuevo o recurrente
   */
  @Public()
  @Post('agente/verificar-cliente')
  @HttpCode(HttpStatus.OK)
  async verificarClienteAgente(
    @Body() dto: { user_id_plataforma: string; plataforma: string },
  ): Promise<any> {
    try {
      const cliente = await this.citasService.buscarClientePorPlataforma(
        dto.user_id_plataforma,
        dto.plataforma,
      );

      if (!cliente) {
        return {
          existe: false,
          cliente: null,
          tiene_citas_previas: false,
        };
      }

      const citasPrevias = await this.citasService.contarCitasCliente(cliente.id);

      return {
        existe: true,
        cliente: {
          id: cliente.id,
          nombre: cliente.nombreCompleto,
          telefono: cliente.telefono,
          email: cliente.email,
        },
        tiene_citas_previas: citasPrevias > 0,
        total_citas: citasPrevias,
      };
    } catch (error) {
      return {
        error: error.message,
        existe: false,
      };
    }
  }

  /**
   * Endpoint 2: Crear cita desde el agente (n8n)
   * Este es el endpoint principal que n8n llamará
   */
  @Public()
  @Post('agente/crear')
  @HttpCode(HttpStatus.CREATED)
  async crearCitaDesdeAgente(
    @Body()
    dto: {
      user_id_plataforma: string;
      plataforma: string;
      nombre_completo: string;
      telefono: string;
      email?: string;
      especialidad: string;
      descripcion: string;
      urgencia: 'alta' | 'media' | 'baja';
      fecha: string;
      hora: string;
    },
  ): Promise<any> {
    try {
      return await this.citasService.crearCitaDesdeAgente(dto);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Endpoint 3: Consultar disponibilidad
   * Usado por n8n para sugerir horarios al usuario
   */
  @Public()
  @Post('agente/disponibilidad')
  @HttpCode(HttpStatus.OK)
  async consultarDisponibilidad(
    @Body()
    dto: {
      especialidad: string;
      urgencia: string;
      fecha_deseada?: string;
    },
  ): Promise<any> {
    try {
      const horarios = this.citasService.generarHorariosSugeridos(
        dto.urgencia,
        dto.fecha_deseada,
      );

      return {
        especialidad: dto.especialidad,
        horarios_sugeridos: horarios,
        mensaje: `Horarios disponibles para ${dto.especialidad}`,
      };
    } catch (error) {
      return {
        error: error.message,
        horarios_sugeridos: [],
      };
    }
  }

  /**
   * Endpoint 4: Obtener citas de un cliente por plataforma
   * Para que el bot pueda consultar citas existentes
   */
  @Public()
  @Get('agente/mis-citas/:user_id_plataforma/:plataforma')
  async obtenerCitasClientePorPlataforma(
    @Param('user_id_plataforma') userId: string,
    @Param('plataforma') plataforma: string,
  ): Promise<any> {
    try {
      const cliente = await this.citasService.buscarClientePorPlataforma(
        userId,
        plataforma,
      );

      if (!cliente) {
        return {
          citas: [],
          mensaje: 'No se encontraron citas',
        };
      }

      const citas = await this.citasService.findByCliente(cliente.id);

      return {
        cliente: {
          nombre: cliente.nombreCompleto,
          telefono: cliente.telefono,
        },
        total_citas: citas.length,
        citas: citas.map((c) => ({
          id: c.id,
          fecha: c.fecha,
          hora: c.hora,
          estado: c.estado,
          urgencia: c.urgencia,
          descripcion: c.descripcion,
        })),
      };
    } catch (error) {
      return {
        error: error.message,
        citas: [],
      };
    }
  }
}
