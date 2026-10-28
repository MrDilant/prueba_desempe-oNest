import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { VehicleStatus } from '../enums/vehicle-status.enum';

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    plate: string;

    @Column()
    brand: string;

    @Column()
    model: string;

    @Column({ type: 'int'})
    year: number;

    @Column({ type: 'int' })
    mileage: number;

    @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
    status: VehicleStatus;
}