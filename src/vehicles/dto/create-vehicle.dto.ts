import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateVehicleDto {
    //normaliza las placas: sin espacio y en mayusculas
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value ))
    @IsString()
    @IsNotEmpty()
    plate: string;

    @IsString()
    @IsNotEmpty()
    brand: string;

    @IsString()
    @IsNotEmpty()
    model: string;

    @IsInt()
    @Min(1950)
    @Max(2100)
    year: number;

    @IsInt()
    @Min(0)
    mileage: number;
}