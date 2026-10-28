import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ default: true })
  isActive: boolean;
}