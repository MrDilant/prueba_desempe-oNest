import {
  Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Mechanic } from '../../mechanics/entities/mechanic.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Workshop } from '../../workshops/entities/workshop.entity';
import { MaintenanceStatus, MaintenanceType } from '../enums/maintenance.enums';

@Entity('maintenances')
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  //kilometraje registrado al programar el mantenimiento
  @Column({ type: 'int' })
  mileage: number;

  //horario programado (inicio y fin): permite detectar cruces del mecanico
  @Column({ type: 'timestamptz' })
  scheduledStart: Date;

  @Column({ type: 'timestamptz' })
  scheduledEnd: Date;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  status: MaintenanceStatus;

  //relaciones: muchos mantenimientos pertenecen a un vehiculo, un mecanico y un taller
  @ManyToOne(() => Vehicle, { nullable: false })
  vehicle: Vehicle;

  @ManyToOne(() => Mechanic, { nullable: false })
  mechanic: Mechanic;

  @ManyToOne(() => Workshop, { nullable: false })
  workshop: Workshop;

  //datos de cierre (solo se llenan al completar)
  @Column({ type: 'text', nullable: true })
  workDone: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    //postgreSQL devuelve los decimales como texto; lo convertimos a numero
    transformer: {
      to: (value?: number | null) => value,
      from: (value: string | null) => (value === null ? null : parseFloat(value)),
    },
  })
  finalCost: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  finalMileage: number | null;

  @CreateDateColumn()
  createdAt: Date;
}