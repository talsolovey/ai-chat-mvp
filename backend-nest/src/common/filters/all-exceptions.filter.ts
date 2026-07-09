import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL';

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      res.status(status).json({
        error: {
          code: CODE_BY_STATUS[status] ?? 'INTERNAL',
          message: this.extractMessage(exception),
        },
      });
      return;
    }

    if (this.isDatabaseError(exception)) {
      this.logger.error(
        'Database error',
        exception instanceof Error ? exception.stack : String(exception),
      );
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message:
            'The service is temporarily unavailable. Please try again shortly.',
        },
      });
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: 'INTERNAL', message: 'Something went wrong.' },
    });
  }

  private isDatabaseError(exception: unknown): boolean {
    if (!(exception instanceof Error)) {
      return false;
    }
    // Mongoose connection/buffering failures surface as MongooseError, and the
    // underlying driver errors are all named Mongo* (e.g. MongoServerSelectionError).
    return (
      exception.name === 'MongooseError' || exception.name.startsWith('Mongo')
    );
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const message = response.message;
      if (Array.isArray(message)) {
        return message.join(', ');
      }
      if (typeof message === 'string') {
        return message;
      }
    }
    return exception.message;
  }
}
