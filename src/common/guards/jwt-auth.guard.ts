import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * GUARD GLOBAL: se ejecuta en TODAS las rutas.
 * Si la ruta es @Public() lo salta; si no, exige "Authorization: Bearer <token>".
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const [type, token] = (request.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token no enviado');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    return true;
  }
}