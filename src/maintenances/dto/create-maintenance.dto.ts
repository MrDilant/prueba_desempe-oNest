import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { MaintenanceType } from '../enums/maintenance.enums';

export class CreateMaintenanceDto {
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(0)
  mileage: number;

  @IsDateString()
  scheduledStart: string; //ejemplo: 2026-11-02T08:00:00-05:00

  @IsDateString()
  scheduledEnd: string;

  @IsInt()
  vehicleId: number;

  @IsInt()
  mechanicId: number;

  @IsInt()
  workshopId: number;
}