import {
  IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { MaintenanceStatus } from '../enums/maintenance.enums';

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  /*datos de cierre: opcionales aqui, pero OBLIGATORIOS si status = COMPLETED
  (esa regla la valida el servicio con un mensaje claro)*/
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  workDone?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalCost?: number;

  @IsOptional()
  @IsDateString()
  finishedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  finalMileage?: number;
}