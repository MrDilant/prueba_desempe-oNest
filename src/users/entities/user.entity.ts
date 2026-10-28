import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    //select:false => la contraseña nunca sale en las consultas normales
    @Column({ select: false })
    password: string;

    @Column({ type: 'enum', enum: Role, default: Role.TECHNICIAN })
    role: Role;

    @CreateDateColumn()
    createdAt: Date;
}