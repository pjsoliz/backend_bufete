import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TipoCaso } from './tipo-caso.entity';
import { Cita } from './cita.entity';

@Entity('areas_derecho')
export class AreaDerecho {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Relaciones
  @OneToMany(() => TipoCaso, (tipoCaso) => tipoCaso.areaDerecho)
  tiposCaso: TipoCaso[];

  @OneToMany(() => Cita, (cita) => cita.areaDerecho)
  citas: Cita[];
}
