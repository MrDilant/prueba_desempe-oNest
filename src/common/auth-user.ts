import { Role } from '../users/enums/role.enum';

//lo que se guarda en request.user despues de validar el JWT
export class AuthUser {
    id: number;
    email: string;
    role: Role;
}