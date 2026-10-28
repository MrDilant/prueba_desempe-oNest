import { IsBoolean, isBoolean } from "class-validator";

//Reutilizable para activar/inactivar mecanicos y talleres
export class SetActiveDto {
    @IsBoolean()
    isActive: boolean;
}