import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMechanicDto } from './create-mechanic.dto';

//igual que crear pero opcional y sin permitir cambiar el usuario vinculado
export class UpdateMechanicDto extends PartialType(OmitType(CreateMechanicDto, ['userId'] as const)) {}