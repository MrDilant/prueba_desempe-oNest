import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  specialty: string;

  //estado del mecanico: true = activo, false = inactivo
  @Column({ default: true })
  isActive: boolean;

  //vinculo opcional con un usuario TECHNICIAN (asi el tecnico ve sus mantenimientos)
  @OneToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User | null;
}