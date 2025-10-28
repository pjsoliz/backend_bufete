import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Abogado } from './abogado.entity';
import { Cita } from './cita.entity';

@Entity('oficinas')
export class Oficina {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Relaciones
  @OneToMany(() => Abogado, (abogado) => abogado.oficina)
  abogados: Abogado[];

  @OneToMany(() => Cita, (cita) => cita.oficina)
  citas: Cita[];
}
