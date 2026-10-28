import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';

// Todos los campos de creacion, pero opcionales
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}