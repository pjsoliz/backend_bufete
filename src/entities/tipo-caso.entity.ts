import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AreaDerecho } from './area-derecho.entity';
import { Cita } from './cita.entity';

@Entity('tipos_caso')
export class TipoCaso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'area_derecho_id' })
  areaDerechoId: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Relaciones
  @ManyToOne(() => AreaDerecho, (areaDerecho) => areaDerecho.tiposCaso)
  @JoinColumn({ name: 'area_derecho_id' })
  areaDerecho: AreaDerecho;

  @OneToMany(() => Cita, (cita) => cita.tipoCaso)
  citas: Cita[];
}
