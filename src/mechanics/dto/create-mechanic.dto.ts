import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMechanicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  specialty: string;

  //opcional: id del usuario TECHNICIAN al que se vincula este mecanico
  @IsOptional()
  @IsInt()
  userId?: number;
}