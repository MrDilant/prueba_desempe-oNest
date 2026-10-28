import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  //sin @Roles: cualquier usuario autenticado puede listar
  @Get()
  findAll() {
    return this.vehiclesService.findAll();
  }

  //va ANTES de ':id' para que "plate" no se confunda con un id
  @Get('plate/:plate')
  findByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  inactivate(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.inactivate(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.activate(id);
  }
}