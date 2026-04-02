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
  // ============================================
  // 🆕 ENDPOINTS PARA NOTIFICACIONES Y RECORDATORIOS
  // ============================================

  @Public()
@Get('proximas-hora')
async getCitasProximasHora() {
  const ahora = new Date();
  
  // ⚠️ TEMPORAL PARA PRUEBAS: 70-74 horas (aproximadamente 3 días)
  const unaHoraDespues = new Date(ahora.getTime() + 1 * 60 * 60 * 1000);
  const dosHorasDespues = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
  
  console.log('🔍 BUSCANDO CITAS PARA RECORDATORIO:');
  console.log('  ⏰ Hora actual:', ahora.toLocaleString('es-BO'));
  console.log('  📅 Desde:', unaHoraDespues.toLocaleString('es-BO'));
  console.log('  📅 Hasta:', dosHorasDespues.toLocaleString('es-BO'));
  
  const citas = await this.citasService.findAll({
    estado: 'confirmada'
  });
  
  const citasProximas = citas.filter(cita => {
    // ✅ CONVERTIR FECHA STRING SIN ZONA HORARIA
    const [year, month, day] = cita.fecha.split('-').map(Number);
    const [horas, minutos] = cita.hora.split(':').map(Number);
    const fechaHoraCita = new Date(year, month - 1, day, horas, minutos, 0, 0);
    
    const dentroRango = fechaHoraCita >= unaHoraDespues && fechaHoraCita <= dosHorasDespues;
    const noEnviado = !cita.recordatorioEnviado;
    
    if (dentroRango && noEnviado) {
      console.log('  ✅ Cita encontrada:', {
        id: cita.id,
        fecha: cita.fecha,
        hora: cita.hora,
        cliente: cita.cliente?.nombreCompleto || 'Sin nombre'
      });
    }
    
    return dentroRango && noEnviado;
  });
  
  console.log(`  📊 Total citas encontradas: ${citasProximas.length}`);
  
  return citasProximas;
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
  // ENDPOINTS PARA EL AGENTE (n8n)
  // ============================================

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
        error: (error as any).message,
        existe: false,
      };
    }
  }

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
      abogado_nombre?: string;
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
        error: (error as any).message,
      };
    }
  }

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
        error: (error as any).message,
        horarios_sugeridos: [],
      };
    }
  }

  @Public()
@Post('agente/disponibilidad-real')
@HttpCode(HttpStatus.OK)
async consultarDisponibilidadReal(
  @Body() dto: { abogado_nombre: string; fecha: string },
): Promise<any> {
  try {
    return await this.citasService.consultarDisponibilidadReal(
      dto.abogado_nombre,
      dto.fecha,
    );
  } catch (error) {
    return {
      error: (error as any).message,
      horarios_disponibles: [],
      horarios_ocupados: [],
    };
  }
}

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
        error: (error as any).message,
        citas: [],
      };
    }
  }

  @Public()
  @Patch(':id/recordatorio-enviado')
  async marcarRecordatorioEnviado(@Param('id') id: string) {
    const cita = await this.citasService.findOne(id);
    return await this.citasService.update(id, { recordatorioEnviado: true } as any);
  }

  @Public()
  @Post('notificar-cambio-estado')
  async notificarCambioEstado(@Body() body: any) {
    const cita = await this.citasService.findOne(body.citaId);
    
    const datosNotificacion = {
      cita_id: cita.id,
      estado: cita.estado,
      estado_anterior: body.estadoAnterior || 'pendiente',
      cliente_nombre: cita.cliente.nombreCompleto,
      cliente_telefono: cita.cliente.telefono,
      cliente_telegram_id: cita.cliente.userIdPlataforma,
      abogado_nombre: cita.abogado.nombre,
      abogado_telegram_id: cita.abogado.userIdTelegram,
      fecha: cita.fecha,
      hora: cita.hora,
      especialidad: cita.areaDerecho.nombre,
      usuario_nombre: body.usuarioNombre || 'Sistema',
      motivo_cancelacion: cita.motivoCancelacion || null
    };
    
    const webhookUrl = process.env.N8N_WEBHOOK_NOTIFICACIONES || 
                       'http://localhost:5678/webhook/notificar-cambio-estado';
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosNotificacion)
      });
      
      const result = await response.json();
      return { success: true, mensaje: 'Notificaciones enviadas', data: result };
    } catch (error) {
      console.error('Error al notificar cambio de estado:', error);
      return { success: false, mensaje: 'Error al enviar notificaciones', error: (error as any).message };
    }
  }
}