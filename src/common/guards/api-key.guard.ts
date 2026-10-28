import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * GUARD ESPECÍFICO para integraciones externas: valida x-api-key
 * contra las claves de la variable de entorno API_KEYS (separadas por coma).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const apiKey = context.switchToHttp().getRequest().headers['x-api-key'];

    const validKeys = (this.config.get<string>('API_KEYS') ?? '')
      .split(',')
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    if (typeof apiKey !== 'string' || !validKeys.includes(apiKey)) {
      throw new UnauthorizedException('API Key inválida o no enviada');
    }
    return true;
  }
}