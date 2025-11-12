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
    // Validar que la fecha no sea pasada
    const fechaCita = new Date(createCitaDto.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaCita < hoy) {
      throw new BadRequestException('No se puede crear una cita en una fecha pasada');
    }

    // Validar que no exista una cita para el mismo abogado en la misma fecha y hora
    await this.validateCitaDisponibilidad(
      createCitaDto.abogadoId,
      createCitaDto.fecha,
      createCitaDto.hora,
    );

    // Validar que existan las relaciones
    await this.validateRelaciones(createCitaDto);

    // Crear la cita
    const cita = this.citaRepository.create({
      ...createCitaDto,
      estado: 'pendiente',
      urgencia: createCitaDto.urgencia || 'media',
      recordatorioEnviado: false,
    });

    return await this.citaRepository.save(cita);
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

    // Filtros
    if (filterDto.fechaInicio && filterDto.fechaFin) {
      query.andWhere('cita.fecha BETWEEN :fechaInicio AND :fechaFin', {
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

    // Si está cancelada o completada, no se puede editar
    if (cita.estado === 'cancelada' || cita.estado === 'completada') {
      throw new BadRequestException('No se puede editar una cita cancelada o completada');
    }

    // Si se cambia fecha u hora, validar disponibilidad
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

  // Métodos privados de validación
  private async validateCitaDisponibilidad(
    abogadoId: string,
    fecha: Date,
    hora: string,
    citaIdExcluir?: string,
  ): Promise<void> {
    const query = this.citaRepository
      .createQueryBuilder('cita')
      .where('cita.abogadoId = :abogadoId', { abogadoId })
      .andWhere('cita.fecha = :fecha', { fecha })
      .andWhere('cita.hora = :hora', { hora })
      .andWhere('cita.estado != :estado', { estado: 'cancelada' });

    if (citaIdExcluir) {
      query.andWhere('cita.id != :citaIdExcluir', { citaIdExcluir });
    }

    const citaExistente = await query.getOne();

    if (citaExistente) {
      throw new ConflictException(
        'Ya existe una cita para este abogado en la fecha y hora especificadas',
      );
    }
  }

  private async validateRelaciones(createCitaDto: CreateCitaDto): Promise<void> {
    // Validar que el cliente exista
    const cliente = await this.clienteRepository.findOne({
      where: { id: createCitaDto.clienteId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Validar que el abogado exista y esté activo
    const abogado = await this.abogadoRepository.findOne({
      where: { id: createCitaDto.abogadoId },
    });

    if (!abogado) {
      throw new NotFoundException('Abogado no encontrado');
    }

    if (!abogado.activo) {
      throw new BadRequestException('El abogado seleccionado no está activo');
    }

    // Aquí podrías agregar más validaciones para las otras relaciones si lo necesitas
  }

  // ============================================
  // 🆕 MÉTODOS PARA EL AGENTE (n8n)
  // ============================================

  /**
   * Buscar cliente por ID de plataforma (WhatsApp, Telegram, etc)
   */
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

  /**
   * Crear cliente desde el agente (chatbot)
   */
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

  /**
   * Contar citas de un cliente
   */
  async contarCitasCliente(clienteId: string): Promise<number> {
    return await this.citaRepository.count({
      where: { clienteId },
    });
  }

  /**
   * Crear cita completa desde el agente (con toda la lógica)
   */
  async crearCitaDesdeAgente(data: {
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
  }): Promise<any> {
    try {
      // 1. Buscar o crear cliente
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

      // 2. Buscar área de derecho (especialidad)
      const areaDerecho = await this.findAreaDerechoByNombre(data.especialidad);
      if (!areaDerecho) {
        throw new NotFoundException(
          `Especialidad '${data.especialidad}' no encontrada`,
        );
      }

      // 3. Buscar abogado disponible (por ahora el primero activo)
      const abogado = await this.findAbogadoDisponible(areaDerecho.id);

      // 4. Obtener IDs por defecto
      const tipoCita = await this.getTipoCitaPorDefecto();
      const tipoCaso = await this.getTipoCasoPorDefecto();
      const oficina = await this.getOficinaPorDefecto();

      // 5. Crear la cita
      const cita = this.citaRepository.create({
        clienteId: cliente.id,
        abogadoId: abogado?.id || null,
        areaDerechoId: areaDerecho.id,
        tipoCasoId: tipoCaso?.id || null,
        tipoCitaId: tipoCita?.id || null,
        oficinaId: oficina?.id || null,
        fecha: new Date(data.fecha),
        hora: data.hora,
        descripcion: data.descripcion,
        urgencia: data.urgencia,
        estado: 'pendiente',
        origen: 'chatbot',
        telefonoContacto: data.telefono,
        recordatorioEnviado: false,
      });

      const citaGuardada = await this.citaRepository.save(cita);

      // 6. Retornar respuesta formateada
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

  /**
   * Generar horarios sugeridos según urgencia
   */
  generarHorariosSugeridos(
    urgencia: string,
    fechaDeseada?: string,
  ): Array<{ fecha: string; hora: string; disponible: boolean }> {
    const sugerencias = [];
    const hoy = new Date();

    let diasAdelante = 7; // Por defecto (baja)
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
  // 🔧 MÉTODOS AUXILIARES PRIVADOS
  // ============================================

  /**
   * Buscar área de derecho por nombre (Civil, Familiar, Penal)
   */
  private async findAreaDerechoByNombre(nombre: string): Promise<any> {
    const nombreLower = nombre.toLowerCase();

    // CAMBIO: especialidades → areas_derecho
    const areas = await this.citaRepository.query(
      `SELECT * FROM areas_derecho WHERE LOWER(nombre) LIKE $1 AND activo = true LIMIT 1`,
      [`%${nombreLower}%`],
    );

    return areas[0] || null;
  }

  /**
   * Buscar abogado disponible por especialidad
   */
  private async findAbogadoDisponible(areaDerechoId: string): Promise<any> {
    // Por ahora retorna el primer abogado activo
    // Aquí puedes implementar lógica más compleja de disponibilidad
    return await this.abogadoRepository.findOne({
      where: { activo: true },
    });
  }

  /**
   * Obtener tipo de cita por defecto
   */
  private async getTipoCitaPorDefecto(): Promise<any> {
    // Ajusta según tu estructura
    const result = await this.citaRepository.query(
      `SELECT * FROM tipos_cita LIMIT 1`,
    );
    return result[0] || null;
  }

  /**
   * Obtener tipo de caso por defecto
   */
  private async getTipoCasoPorDefecto(): Promise<any> {
    const result = await this.citaRepository.query(
      `SELECT * FROM tipos_caso LIMIT 1`,
    );
    return result[0] || null;
  }

  /**
   * Obtener oficina por defecto
   */
  private async getOficinaPorDefecto(): Promise<any> {
    const result = await this.citaRepository.query(
      `SELECT * FROM oficinas LIMIT 1`,
    );
    return result[0] || null;
  }
}
