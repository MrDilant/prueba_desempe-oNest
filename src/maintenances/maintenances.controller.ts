import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MaintenancesService } from './maintenances.service';

@ApiTags('Maintenances')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.maintenancesService.findAll();
  }

  @Get('active')
  @Roles(Role.ADMIN)
  findActive() {
    return this.maintenancesService.findActive();
  }

  //tecnico: sus mantenimientos asignados con vehiculo y taller
  @Get('my')
  @Roles(Role.TECHNICIAN)
  findMine(@CurrentUser() user: AuthUser) {
    return this.maintenancesService.findMine(user);
  }

  @Get('vehicle/:vehicleId')
  @Roles(Role.ADMIN)
  findByVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  @Roles(Role.ADMIN)
  findHistory(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findHistoryByVehicle(vehicleId);
  }

  @Get('mechanic/:mechanicId')
  @Roles(Role.ADMIN)
  findByMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  //las rutas con ':id' van al final para no "tragarse" las rutas fijas de arriba
  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.maintenancesService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.maintenancesService.updateStatus(id, dto, user);
  }
}