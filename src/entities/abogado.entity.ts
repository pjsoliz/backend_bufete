import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Oficina } from './oficina.entity';
import { Cita } from './cita.entity';

@Entity('abogados')
export class Abogado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  especialidad: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'uuid', name: 'oficina_id', nullable: true })
  oficinaId: string;

  @Column({ type: 'varchar', length: 20, name: 'plataforma_notificacion', nullable: true })
  plataformaNotificacion: string; // 'telegram' o 'whatsapp'

  @Column({ type: 'varchar', length: 100, name: 'user_id_telegram', nullable: true })
  userIdTelegram: string;

  @Column({ type: 'varchar', length: 20, name: 'numero_whatsapp', nullable: true })
  numeroWhatsapp: string;

  @Column({ type: 'boolean', name: 'recibir_notificaciones', default: true })
  recibirNotificaciones: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Oficina, (oficina) => oficina.abogados)
  @JoinColumn({ name: 'oficina_id' })
  oficina: Oficina;

  @OneToMany(() => Cita, (cita) => cita.abogado)
  citas: Cita[];
}
