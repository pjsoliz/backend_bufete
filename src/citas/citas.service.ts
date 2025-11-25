import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Cita } from '../entities/cita.entity';
import { Cliente } from '../entities/cliente.entity';
import { Abogado } from '../entities/abogado.entity';
import { CreateCitaDto, UpdateCitaDto, UpdateEstadoCitaDto, FilterCitasDto } from './dto/cita.dto';

@Injectable()
export class CitasService {
  constructor(
    @InjectRepository(Cita)
    private citaRepository: Repository<Cita>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Abogado)
    private abogadoRepository: Repository<Abogado>,
  ) {}

  async create(createCitaDto: CreateCitaDto): Promise<Cita> {
  const hoy = new Date().toISOString().split('T')[0];
  
  if (createCitaDto.fecha < hoy) {
    throw new BadRequestException('No se puede crear una cita en una fecha pasada');
  }

  await this.validateCitaDisponibilidad(
    createCitaDto.abogadoId,
    createCitaDto.fecha,
    createCitaDto.hora,
  );

  await this.validateRelaciones(createCitaDto);

  console.log('🔍 DEBUG - Creando cita con fecha:', createCitaDto.fecha);

  // ✅ USAR SQL DIRECTO para evitar conversión de TypeORM
  const result = await this.citaRepository.query(`
    INSERT INTO citas (
      id, cliente_id, abogado_id, area_derecho_id, tipo_caso_id, 
      tipo_cita_id, oficina_id, fecha, hora, descripcion, 
      notas_adicionales, urgencia, origen, telefono_contacto, 
      recordatorio_enviado, estado, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, $11, $12, $13, false, 'pendiente', NOW(), NOW()
    ) RETURNING id
  `, [
    createCitaDto.clienteId,
    createCitaDto.abogadoId,
    createCitaDto.areaDerechoId,
    createCitaDto.tipoCasoId,
    createCitaDto.tipoCitaId,
    createCitaDto.oficinaId,
    createCitaDto.fecha,
    createCitaDto.hora,
    createCitaDto.descripcion || null,
    createCitaDto.notasAdicionales || null,
    createCitaDto.urgencia || 'media',
    createCitaDto.origen,
    createCitaDto.telefonoContacto || null
  ]);

  console.log('✅ Cita creada con ID:', result[0].id);

  return await this.findOne(result[0].id);
}

  async findAll(filterDto: FilterCitasDto): Promise<Cita[]> {
    const query = this.citaRepository
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.cliente', 'cliente')
      .leftJoinAndSelect('cita.abogado', 'abogado')
      .leftJoinAndSelect('cita.areaDerecho', 'areaDerecho')
      .leftJoinAndSelect('cita.tipoCaso', 'tipoCaso')
      .leftJoinAndSelect('cita.tipoCita', 'tipoCita')
      .leftJoinAndSelect('cita.oficina', 'oficina')
      .leftJoinAndSelect('cita.creadoPorUsuario', 'creadoPorUsuario');

    if (filterDto.fechaInicio && filterDto.fechaFin) {
      query.andWhere('cita.fecha >= :fechaInicio AND cita.fecha <= :fechaFin', {
        fechaInicio: filterDto.fechaInicio,
        fechaFin: filterDto.fechaFin,
      });
    }

    if (filterDto.estado) {
      query.andWhere('cita.estado = :estado', { estado: filterDto.estado });
    }

    if (filterDto.abogadoId) {
      query.andWhere('cita.abogadoId = :abogadoId', { abogadoId: filterDto.abogadoId });
    }

    if (filterDto.clienteId) {
      query.andWhere('cita.clienteId = :clienteId', { clienteId: filterDto.clienteId });
    }

    if (filterDto.origen) {
      query.andWhere('cita.origen = :origen', { origen: filterDto.origen });
    }

    if (filterDto.urgencia) {
      query.andWhere('cita.urgencia = :urgencia', { urgencia: filterDto.urgencia });
    }

    if (filterDto.busqueda) {
      query.andWhere(
        '(cliente.nombreCompleto ILIKE :busqueda OR abogado.nombre ILIKE :busqueda)',
        { busqueda: `%${filterDto.busqueda}%` },
      );
    }

    query.orderBy('cita.fecha', 'DESC').addOrderBy('cita.hora', 'DESC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<Cita> {
    const cita = await this.citaRepository.findOne({
      where: { id },
      relations: [
        'cliente',
        'abogado',
        'areaDerecho',
        'tipoCaso',
        'tipoCita',
        'oficina',
        'creadoPorUsuario',
        'canceladaPorUsuario',
      ],
    });

    if (!cita) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    return cita;
  }

  async update(id: string, updateCitaDto: UpdateCitaDto): Promise<Cita> {
    const cita = await this.findOne(id);

    if (cita.estado === 'cancelada' || cita.estado === 'completada') {
      throw new BadRequestException('No se puede editar una cita cancelada o completada');
    }

    if (updateCitaDto.fecha || updateCitaDto.hora || updateCitaDto.abogadoId) {
      const abogadoId = updateCitaDto.abogadoId || cita.abogadoId;
      const fecha = updateCitaDto.fecha || cita.fecha;
      const hora = updateCitaDto.hora || cita.hora;

      await this.validateCitaDisponibilidad(abogadoId, fecha, hora, id);
    }

    Object.assign(cita, updateCitaDto);

    return await this.citaRepository.save(cita);
  }

  async updateEstado(
    id: string,
    updateEstadoDto: UpdateEstadoCitaDto,
    usuarioId?: string,
  ): Promise<Cita> {
    const cita = await this.findOne(id);

    cita.estado = updateEstadoDto.estado;

    if (updateEstadoDto.estado === 'cancelada') {
      cita.motivoCancelacion = updateEstadoDto.motivoCancelacion;
      cita.fechaCancelacion = new Date();
      if (usuarioId) {
        cita.canceladaPorUsuarioId = usuarioId;
      }
    }

    return await this.citaRepository.save(cita);
  }

  async remove(id: string, usuarioId?: string): Promise<{ message: string }> {
    const cita = await this.findOne(id);

    if (cita.estado === 'completada') {
      throw new BadRequestException('No se puede cancelar una cita completada');
    }

    cita.estado = 'cancelada';
    cita.fechaCancelacion = new Date();
    if (usuarioId) {
      cita.canceladaPorUsuarioId = usuarioId;
    }

    await this.citaRepository.save(cita);

    return { message: 'Cita cancelada exitosamente' };
  }

  async findByAbogado(abogadoId: string): Promise<Cita[]> {
    return await this.citaRepository.find({
      where: { abogadoId },
      relations: ['cliente', 'areaDerecho', 'tipoCaso', 'tipoCita', 'oficina'],
      order: { fecha: 'DESC', hora: 'DESC' },
    });
  }

  async findByCliente(clienteId: string): Promise<Cita[]> {
    return await this.citaRepository.find({
      where: { clienteId },
      relations: ['abogado', 'areaDerecho', 'tipoCaso', 'tipoCita', 'oficina'],
      order: { fecha: 'DESC', hora: 'DESC' },
    });
  }

  // ============================================
  // MÉTODOS PRIVADOS DE VALIDACIÓN
  // ============================================

  private async validateCitaDisponibilidad(
    abogadoId: string,
    fecha: string | Date,
    hora: string,
    citaIdExcluir?: string,
  ): Promise<void> {
    const horaNormalizada = hora.toString().substring(0, 5);
    
    const fechaString = typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0];
    
    const citasDelDia = await this.citaRepository.find({
      where: {
        abogadoId: abogadoId,
        fecha: fechaString,
        estado: In(['pendiente', 'confirmada'])
      }
    });
    
    const citaExistente = citasDelDia.find(cita => {
      if (citaIdExcluir && cita.id === citaIdExcluir) {
        return false;
      }
      const horaCita = cita.hora.toString().substring(0, 5);
      return horaCita === horaNormalizada;
    });

    if (citaExistente) {
      throw new ConflictException(
        'Ya existe una cita para este abogado en la fecha y hora especificadas',
      );
    }
  }

  private async validateRelaciones(createCitaDto: CreateCitaDto): Promise<void> {
    const cliente = await this.clienteRepository.findOne({
      where: { id: createCitaDto.clienteId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const abogado = await this.abogadoRepository.findOne({
      where: { id: createCitaDto.abogadoId },
    });

    if (!abogado) {
      throw new NotFoundException('Abogado no encontrado');
    }

    if (!abogado.activo) {
      throw new BadRequestException('El abogado seleccionado no está activo');
    }
  }

  // ============================================
  // MÉTODOS PARA EL AGENTE (n8n)
  // ============================================

  async buscarClientePorPlataforma(
    userId: string,
    plataforma: string,
  ): Promise<Cliente | null> {
    return await this.clienteRepository.findOne({
      where: {
        userIdPlataforma: userId,
        plataforma: plataforma,
      },
    });
  }

  async crearClienteDesdeAgente(data: {
    user_id_plataforma: string;
    plataforma: string;
    nombre_completo: string;
    telefono: string;
    email?: string;
  }): Promise<Cliente> {
    const cliente = this.clienteRepository.create({
      nombreCompleto: data.nombre_completo,
      telefono: data.telefono,
      email: data.email || null,
      plataforma: data.plataforma,
      userIdPlataforma: data.user_id_plataforma,
    });

    return await this.clienteRepository.save(cliente);
  }

  async contarCitasCliente(clienteId: string): Promise<number> {
    return await this.citaRepository.count({
      where: { clienteId },
    });
  }

  async crearCitaDesdeAgente(data: {
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
  }): Promise<any> {
    try {
      let cliente = await this.buscarClientePorPlataforma(
        data.user_id_plataforma,
        data.plataforma,
      );

      if (!cliente) {
        cliente = await this.crearClienteDesdeAgente({
          user_id_plataforma: data.user_id_plataforma,
          plataforma: data.plataforma,
          nombre_completo: data.nombre_completo,
          telefono: data.telefono,
          email: data.email,
        });
      }

      const areaDerecho = await this.findAreaDerechoByNombre(data.especialidad);
      if (!areaDerecho) {
        throw new NotFoundException(
          `Especialidad '${data.especialidad}' no encontrada`,
        );
      }

      // BUSCAR ABOGADO POR NOMBRE SI SE PROPORCIONÓ
      let abogado = null;

      if (data.abogado_nombre) {
        console.log('🔍 Buscando abogado por nombre:', data.abogado_nombre);
        
        // Primero intentar búsqueda exacta
        abogado = await this.abogadoRepository.findOne({
          where: { 
            nombre: data.abogado_nombre,
            activo: true
          }
        });
        
        // Si no se encontró, buscar por coincidencia parcial
        if (!abogado) {
          const todosAbogados = await this.abogadoRepository.find({
            where: { 
              activo: true
            }
          });
          
          // Buscar coincidencia parcial (case insensitive)
          abogado = todosAbogados.find(a => {
            const nombreAbogadoLower = a.nombre.toLowerCase();
            const nombreBuscadoLower = data.abogado_nombre.toLowerCase();
            
            return nombreAbogadoLower.includes(nombreBuscadoLower) ||
                   nombreBuscadoLower.includes(nombreAbogadoLower);
          });
          
          if (abogado) {
            console.log('✅ Abogado encontrado por coincidencia parcial:', abogado.nombre);
          }
        } else {
          console.log('✅ Abogado encontrado por nombre exacto:', abogado.nombre);
        }
      }

      // Si no se encontró abogado específico, buscar uno disponible
      if (!abogado) {
        console.log('⚠️ No se encontró abogado específico, buscando disponible...');
        abogado = await this.findAbogadoDisponible(areaDerecho.id);
        console.log('✅ Abogado disponible asignado:', abogado?.nombre || 'Ninguno');
      }

      const [year, month, day] = data.fecha.split('-').map(Number);
      const [horas, minutos] = data.hora.split(':').map(Number);
      
      const fechaHoraCita = new Date(year, month - 1, day, horas, minutos, 0, 0);
      const ahora = new Date();

      console.log('🔍 DEBUG VALIDACIÓN FECHAS:');
      console.log('  📅 Fecha solicitada:', data.fecha, data.hora);
      console.log('  📅 Fecha parseada:', fechaHoraCita.toLocaleString('es-BO'));
      console.log('  ⏰ Hora actual:', ahora.toLocaleString('es-BO'));
      console.log('  ⌛ Diferencia (min):', Math.round((fechaHoraCita.getTime() - ahora.getTime()) / 1000 / 60));

      const unMinutoAtras = new Date(ahora.getTime() - 60 * 1000);
      
      if (fechaHoraCita <= unMinutoAtras) {
        throw new BadRequestException(
          'No se pueden crear citas en el pasado. Por favor, elija una fecha y hora futura.'
        );
      }

      const dosHorasFuturo = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);

      if (fechaHoraCita < dosHorasFuturo) {
        throw new BadRequestException(
          'Las citas deben agendarse con al menos 2 horas de anticipación.'
        );
      }

      const sesentaDiasFuturo = new Date(ahora.getTime() + 60 * 24 * 60 * 60 * 1000);

      if (fechaHoraCita > sesentaDiasFuturo) {
        throw new BadRequestException(
          'No se pueden crear citas con más de 60 días de anticipación.'
        );
      }

      const horarioValido = this.validarHorarioLaboral(data.hora, fechaHoraCita);
      
      if (!horarioValido.valido) {
        const horariosDisponibles = await this.obtenerHorariosDisponibles(
          abogado.id,
          data.fecha
        );
        
        throw new BadRequestException(
          `${horarioValido.mensaje}. Horarios disponibles: ${horariosDisponibles.join(', ')}`
        );
      }

      if (abogado) {
        const disponibilidad = await this.verificarDisponibilidadAbogado(
          abogado.id,
          data.fecha,
          data.hora,
        );

        if (!disponibilidad.disponible) {
          const horariosDisponibles = await this.obtenerHorariosDisponibles(
            abogado.id,
            data.fecha
          );
          
          if (horariosDisponibles.length > 0) {
            const listaHorarios = horariosDisponibles.join(', ');
            throw new BadRequestException(
              `${disponibilidad.mensaje}\nHorarios disponibles para ese día: ${listaHorarios}`
            );
          } else {
            const siguiente = await this.buscarSiguienteHorarioDisponible(
              abogado.id,
              data.fecha
            );
            
            throw new BadRequestException(
              `${disponibilidad.mensaje}\n\n${siguiente.mensaje}`
            );
          }
        }
      }

      const tipoCita = await this.getTipoCitaPorDefecto();
      const tipoCaso = await this.getTipoCasoPorDefecto();
      const oficina = await this.getOficinaPorDefecto();

      const cita = this.citaRepository.create({
        clienteId: cliente.id,
        abogadoId: abogado?.id || null,
        areaDerechoId: areaDerecho.id,
        tipoCasoId: tipoCaso?.id || null,
        tipoCitaId: tipoCita?.id || null,
        oficinaId: oficina?.id || null,
        fecha: data.fecha,
        hora: data.hora,
        descripcion: data.descripcion,
        urgencia: data.urgencia,
        estado: 'pendiente',
        origen: 'chatbot',
        telefonoContacto: data.telefono,
        recordatorioEnviado: false,
      });

      const citaGuardada = await this.citaRepository.save(cita);

      if (abogado?.userIdTelegram && abogado.recibirNotificaciones) {
        await this.notificarAbogadoNuevaCita(abogado, citaGuardada, cliente, areaDerecho);
      }

      return {
        success: true,
        cita: {
          id: citaGuardada.id,
          fecha: citaGuardada.fecha,
          hora: citaGuardada.hora,
          estado: citaGuardada.estado,
          urgencia: citaGuardada.urgencia,
        },
        cliente: {
          id: cliente.id,
          nombre: cliente.nombreCompleto,
          telefono: cliente.telefono,
        },
        abogado: abogado
          ? {
              id: abogado.id,
              nombre: abogado.nombre,
            }
          : null,
        especialidad: {
          id: areaDerecho.id,
          nombre: areaDerecho.nombre,
        },
        mensaje: abogado
          ? `Cita confirmada con ${abogado.nombre} para el ${data.fecha} a las ${data.hora}`
          : `Cita agendada para el ${data.fecha} a las ${data.hora}. Se asignará un abogado pronto.`,
      };
    } catch (error) {
      throw error;
    }
  }

  generarHorariosSugeridos(
    urgencia: string,
    fechaDeseada?: string,
  ): Array<{ fecha: string; hora: string; disponible: boolean }> {
    const sugerencias = [];
    const hoy = new Date();

    let diasAdelante = 7;
    if (urgencia === 'alta') diasAdelante = 1;
    if (urgencia === 'media') diasAdelante = 3;

    for (let i = 0; i < 3; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + diasAdelante + i);
      const fechaStr = fecha.toISOString().split('T')[0];

      sugerencias.push(
        { fecha: fechaStr, hora: '09:00', disponible: true },
        { fecha: fechaStr, hora: '11:00', disponible: true },
        { fecha: fechaStr, hora: '14:00', disponible: true },
        { fecha: fechaStr, hora: '16:00', disponible: true },
      );
    }

    return sugerencias;
  }

  // ============================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================

  private async findAreaDerechoByNombre(nombre: string): Promise<any> {
    if (!nombre || typeof nombre !== 'string') {
      return null;
    }

    const nombreNormalizado = nombre.trim().charAt(0).toUpperCase() + nombre.trim().slice(1).toLowerCase();

    const areas = await this.citaRepository.query(
      `SELECT * FROM areas_derecho WHERE LOWER(nombre) = LOWER($1) AND activo = true LIMIT 1`,
      [nombreNormalizado],
    );

    return areas[0] || null;
  }

  private async findAbogadoDisponible(areaDerechoId: string): Promise<any> {
    return await this.abogadoRepository.findOne({
      where: { activo: true },
    });
  }

  private async getTipoCitaPorDefecto(): Promise<any> {
    const result = await this.citaRepository.query(
      `SELECT * FROM tipos_cita LIMIT 1`,
    );
    return result[0] || null;
  }

  private async getTipoCasoPorDefecto(): Promise<any> {
    const result = await this.citaRepository.query(
      `SELECT * FROM tipos_caso LIMIT 1`,
    );
    return result[0] || null;
  }

  private async getOficinaPorDefecto(): Promise<any> {
    const result = await this.citaRepository.query(
      `SELECT * FROM oficinas LIMIT 1`,
    );
    return result[0] || null;
  }

  // ============================================
  // MÉTODOS DE VALIDACIÓN DE HORARIOS
  // ============================================

  private validarHorarioLaboral(hora: string, fecha: Date): { 
    valido: boolean; 
    mensaje?: string 
  } {
    const diaSemana = fecha.getDay();
    
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    console.log('🔍 DEBUG HORARIO LABORAL:');
    console.log('  📅 Fecha:', fecha.toLocaleDateString('es-BO'));
    console.log('  📆 Día:', nombresDias[diaSemana]);
    console.log('  ⏰ Hora solicitada:', hora);
    
    if (diaSemana === 0 || diaSemana === 6) {
      return {
        valido: false,
        mensaje: 'Solo se atiende de lunes a viernes'
      };
    }

    const horariosPermitidos = ['08:00', '09:00', '10:00', '11:00'];
    
    if (!horariosPermitidos.includes(hora)) {
      return {
        valido: false,
        mensaje: 'Horarios disponibles: 8:00 AM, 9:00 AM, 10:00 AM, 11:00 AM'
      };
    }
    
    return { valido: true };
  }

  private async verificarDisponibilidadAbogado(
    abogadoId: string,
    fecha: string,
    hora: string,
  ): Promise<{ disponible: boolean; mensaje?: string }> {
    const citasDelDia = await this.citaRepository.find({
      where: {
        abogadoId: abogadoId,
        fecha: fecha,
        estado: In(['pendiente', 'confirmada'])
      }
    });
    
    const horaNormalizada = hora.substring(0, 5);
    
    const citaExistente = citasDelDia.find(cita => {
      const horaCita = cita.hora.toString().substring(0, 5);
      return horaCita === horaNormalizada;
    });

    if (citaExistente) {
      return {
        disponible: false,
        mensaje: `El abogado ya tiene una cita a las ${hora}.`
      };
    }

    return { disponible: true };
  }

  private async obtenerHorariosDisponibles(
    abogadoId: string,
    fecha: string,
  ): Promise<string[]> {
    const horariosBase = ['08:00', '09:00', '10:00', '11:00'];
    
    const citasDelDia = await this.citaRepository.find({
      where: {
        abogadoId: abogadoId,
        fecha: fecha,
        estado: In(['pendiente', 'confirmada'])
      },
      select: ['hora']
    });

    const horariosOcupados = citasDelDia.map(cita => {
      const horaCompleta = cita.hora.toString();
      return horaCompleta.substring(0, 5);
    });
    
    const horariosDisponibles = horariosBase.filter(
      hora => !horariosOcupados.includes(hora)
    );

    return horariosDisponibles;
  }

  private async buscarSiguienteHorarioDisponible(
    abogadoId: string,
    fechaPreferida: string,
  ): Promise<{ fecha: string; hora: string; mensaje: string }> {
    const horariosBase = ['08:00', '09:00', '10:00', '11:00'];
    
    const horariosDisponiblesMismoDia = await this.obtenerHorariosDisponibles(
      abogadoId,
      fechaPreferida
    );
    
    if (horariosDisponiblesMismoDia.length > 0) {
      const [year, month, day] = fechaPreferida.split('-').map(Number);
      const fechaObj = new Date(year, month - 1, day);
      
      const fechaFormateada = fechaObj.toLocaleDateString('es-BO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const listaHorarios = horariosDisponiblesMismoDia.map(h => `• ${h}`).join('\n');
      
      return {
        fecha: fechaPreferida,
        hora: horariosDisponiblesMismoDia[0],
        mensaje: `💡 Horarios disponibles para el ${fechaFormateada}:\n${listaHorarios}\n\nPor favor, elija uno de estos horarios.`
      };
    }
    
    const [year, month, day] = fechaPreferida.split('-').map(Number);
    let fechaBusqueda = new Date(year, month - 1, day);
    fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
    
    for (let i = 0; i < 15; i++) {
      const diaSemana = fechaBusqueda.getDay();
      
      if (diaSemana !== 0 && diaSemana !== 6) {
        const fechaBusquedaStr = fechaBusqueda.toISOString().split('T')[0];
        
        const horariosDisponibles = await this.obtenerHorariosDisponibles(
          abogadoId,
          fechaBusquedaStr
        );
        
        if (horariosDisponibles.length > 0) {
          const fechaFormateada = fechaBusqueda.toLocaleDateString('es-BO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          const listaHorarios = horariosDisponibles.map(h => `• ${h}`).join('\n');
          
          return {
            fecha: fechaBusquedaStr,
            hora: horariosDisponibles[0],
            mensaje: `💡 El día solicitado está completamente ocupado.\n\nEl siguiente día disponible es:\n📅 ${fechaFormateada}\n\nHorarios disponibles:\n${listaHorarios}\n\nPor favor, elija uno de estos horarios.`
          };
        }
      }
      
      fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
    }
    
    return {
      fecha: '',
      hora: '',
      mensaje: '❌ No hay disponibilidad en los próximos 15 días hábiles. Por favor, contacte directamente al bufete.'
    };
  }

  private async notificarAbogadoNuevaCita(
    abogado: any,
    cita: any,
    cliente: any,
    areaDerecho: any,
  ): Promise<void> {
    try {
      const fechaStr = typeof cita.fecha === 'string' ? cita.fecha : cita.fecha.toISOString().split('T')[0];
      const [year, month, day] = fechaStr.split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      
      const fechaFormateada = fecha.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const mensaje = `🔔 *Nueva Cita Asignada*\n\n` +
        `👤 Cliente: ${cliente.nombreCompleto}\n` +
        `📞 Teléfono: ${cliente.telefono}\n` +
        `⚖️ Especialidad: ${areaDerecho.nombre}\n` +
        `📅 Fecha: ${fechaFormateada}\n` +
        `⏰ Hora: ${cita.hora}\n` +
        `📝 Descripción: ${cita.descripcion}\n` +
        `🔴 Urgencia: ${cita.urgencia}\n\n` +
        `📍 *Bufete Genesis Integrales*\n` +
        `Cochabamba, Bolivia`;

      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: abogado.userIdTelegram,
            text: mensaje,
            parse_mode: 'Markdown',
          }),
        }
      );
    } catch (error) {
      console.error('Error al notificar al abogado:', error);
    }
  }
}