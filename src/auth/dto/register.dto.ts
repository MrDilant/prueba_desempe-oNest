import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from '../../users/enums/role.enum';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsEnum(Role, {
    message: (args) =>
    `El rol '${args.value}' no existe. Roles permitidos: ${Object.values(Role).join(', ')}`,
    })
    role: Role;
    
}   