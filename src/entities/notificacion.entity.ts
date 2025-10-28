import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Cita } from './cita.entity';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tipo: string; // 'cita_creada', 'cita_confirmada', 'recordatorio', 'cita_cancelada'

  @Column({ type: 'varchar', length: 20, name: 'destinatario_tipo' })
  destinatarioTipo: string; // 'cliente' o 'abogado'

  @Column({ type: 'uuid', name: 'destinatario_id' })
  destinatarioId: string;

  @Column({ type: 'uuid', name: 'cita_id', nullable: true })
  citaId: string;

  @Column({ type: 'varchar', length: 20 })
  plataforma: string; // 'telegram', 'whatsapp', 'email'

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: string; // 'pendiente', 'enviado', 'fallido'

  @Column({ type: 'text', name: 'error_mensaje', nullable: true })
  errorMensaje: string;

  @Column({ type: 'timestamp', name: 'enviado_at', nullable: true })
  enviadoAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Cita, (cita) => cita.notificaciones, { nullable: true })
  @JoinColumn({ name: 'cita_id' })
  cita: Cita;
}
