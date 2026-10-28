import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkshopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}