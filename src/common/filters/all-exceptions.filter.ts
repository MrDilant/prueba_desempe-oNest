import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * EXCEPTION FILTER: normaliza TODOS los errores al formato de la imagen 3.
 * Conserva el código HTTP real y traduce errores de PostgreSQL
 * (unicidad / llaves foráneas) a 409 para que no terminen en 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
    } else if (exception instanceof QueryFailedError) {
      const code = (exception as QueryFailedError & { code?: string }).code;
      if (code === '23505') {
        statusCode = HttpStatus.CONFLICT;
        message = 'Ya existe un registro con esos datos únicos (placa, correo, etc.)';
      } else if (code === '23503') {
        statusCode = HttpStatus.CONFLICT;
        message = 'La operación entra en conflicto con registros relacionados';
      } else {
        this.logger.error(exception);
      }
    } else {
      this.logger.error(exception);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}