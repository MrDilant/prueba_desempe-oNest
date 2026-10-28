import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MechanicsModule } from '../mechanics/mechanics.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WorkshopsModule } from '../workshops/workshops.module';
import { Maintenance } from './entities/maintenance.entity';
import { MaintenancesController } from './maintenances.controller';
import { MaintenancesService } from './maintenances.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}