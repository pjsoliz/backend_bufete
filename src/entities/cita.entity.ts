import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Abogado } from './abogado.entity';
import { AreaDerecho } from './area-derecho.entity';
import { TipoCaso } from './tipo-caso.entity';
import { TipoCita } from './tipo-cita.entity';
import { Oficina } from './oficina.entity';
import { Usuario } from './usuario.entity';
import { Notificacion } from './notificacion.entity';

@Entity('citas')
export class Cita {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign Keys
  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId: string;

  @Column({ type: 'uuid', name: 'abogado_id' })
  abogadoId: string;

  @Column({ type: 'uuid', name: 'area_derecho_id' })
  areaDerechoId: string;

  @Column({ type: 'uuid', name: 'tipo_caso_id' })
  tipoCasoId: string |  null;

  @Column({ type: 'uuid', name: 'tipo_cita_id', nullable: true })
  tipoCitaId: string | null;

  @Column({ type: 'uuid', name: 'oficina_id', nullable: true  })
  oficinaId: string;

  // Datos de la cita
  @Column({ type: 'date' })
  fecha: string;  // ✅ CAMBIO: Date → string

  @Column({ type: 'time' })
  hora: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', name: 'notas_adicionales', nullable: true })
  notasAdicionales: string;

  @Column({ type: 'varchar', length: 50, default: 'pendiente' })
  estado: string; // 'pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'

  @Column({ type: 'varchar', length: 20, default: 'media' })
  urgencia: string; // 'alta', 'media', 'baja'

  @Column({ type: 'varchar', length: 50 })
  origen: string; // 'chatbot', 'panel_web', 'presencial'

  @Column({ type: 'varchar', length: 20, name: 'telefono_contacto', nullable: true })
  telefonoContacto: string;

  // Recordatorios
  @Column({ type: 'boolean', name: 'recordatorio_enviado', default: false })
  recordatorioEnviado: boolean;

  @Column({ type: 'timestamp', name: 'fecha_recordatorio_enviado', nullable: true })
  fechaRecordatorioEnviado: Date;

  // Cancelación
  @Column({ type: 'uuid', name: 'creado_por_usuario_id', nullable: true })
  creadoPorUsuarioId: string;

  @Column({ type: 'uuid', name: 'cancelada_por_usuario_id', nullable: true })
  canceladaPorUsuarioId: string;

  @Column({ type: 'text', name: 'motivo_cancelacion', nullable: true })
  motivoCancelacion: string;

  @Column({ type: 'timestamp', name: 'fecha_cancelacion', nullable: true })
  fechaCancelacion: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Cliente, (cliente) => cliente.citas)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Abogado, (abogado) => abogado.citas)
  @JoinColumn({ name: 'abogado_id' })
  abogado: Abogado;

  @ManyToOne(() => AreaDerecho, (areaDerecho) => areaDerecho.citas)
  @JoinColumn({ name: 'area_derecho_id' })
  areaDerecho: AreaDerecho;

  @ManyToOne(() => TipoCaso, (tipoCaso) => tipoCaso.citas)
  @JoinColumn({ name: 'tipo_caso_id' })
  tipoCaso: TipoCaso;

  @ManyToOne(() => TipoCita, (tipoCita) => tipoCita.citas)
  @JoinColumn({ name: 'tipo_cita_id' })
  tipoCita: TipoCita;

  @ManyToOne(() => Oficina, (oficina) => oficina.citas)
  @JoinColumn({ name: 'oficina_id' })
  oficina: Oficina;

  @ManyToOne(() => Usuario, (usuario) => usuario.citasCreadas, { nullable: true })
  @JoinColumn({ name: 'creado_por_usuario_id' })
  creadoPorUsuario: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.citasCanceladas, { nullable: true })
  @JoinColumn({ name: 'cancelada_por_usuario_id' })
  canceladaPorUsuario: Usuario;

  @OneToMany(() => Notificacion, (notificacion) => notificacion.cita)
  notificaciones: Notificacion[];
}