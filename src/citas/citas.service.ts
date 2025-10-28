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
}
