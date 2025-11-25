import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Cita } from './cita.entity';
import { Exclude } from 'class-transformer';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'nombre_completo' })
  nombreCompleto: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude() // No exponer el password en las respuestas
  password: string;

  @Column({ type: 'varchar', length: 20, default: 'asistente_legal' })
  rol: string; // 'admin' o 'asistente_legal'

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'timestamp', name: 'ultimo_acceso', nullable: true })
  ultimoAcceso: Date;

  // ⭐ AGREGAR ESTOS 2 CAMPOS PARA RECUPERAR CONTRASEÑA
  @Column({ type: 'varchar', length: 255, name: 'reset_password_token', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', name: 'reset_password_expires', nullable: true })
  resetPasswordExpires: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Cita, (cita) => cita.creadoPorUsuario)
  citasCreadas: Cita[];

  @OneToMany(() => Cita, (cita) => cita.canceladaPorUsuario)
  citasCanceladas: Cita[];
}