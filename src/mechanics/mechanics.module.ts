import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Mechanic } from './entities/mechanic.entity';
import { MechanicsController } from './mechanics.controller';
import { MechanicsService } from './mechanics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Mechanic]), UsersModule],
  controllers: [MechanicsController],
  providers: [MechanicsService],
  exports: [MechanicsService],
})
export class MechanicsModule {}