import { Module } from '@nestjs/common';
import { MaintenancesModule } from '../maintenances/maintenances.module';
import { IntegrationsController } from './integrations.controller';

@Module({
  imports: [MaintenancesModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}