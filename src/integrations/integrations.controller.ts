import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { MaintenancesService } from '../maintenances/maintenances.service';

@ApiTags('Integrations')
@ApiSecurity('api-key')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  //endpoint para sistemas externos: NO usa JWT (@Public) sino x-api-key .

  @Public()
  @UseGuards(ApiKeyGuard)
  @Get('vehicles/:plate/history')
  getVehicleHistory(@Param('plate') plate: string) {
    return this.maintenancesService.getVehicleHistoryByPlate(plate);
  }
}