import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cita } from './cita.entity';

@Entity('tipos_cita')
export class TipoCita {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'integer', name: 'duracion_estimada_minutos', nullable: true })
  duracionEstimadaMinutos: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Relaciones
  @OneToMany(() => Cita, (cita) => cita.tipoCita)
  citas: Cita[];
}
