import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string[] = ['Internal server error'];
    let error = 'Internal Server Error';

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = [exceptionResponse];
        error = exception.name || 'Error';
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const respObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(respObj.message)) {
          message = respObj.message.map((m) => String(m));
        } else if (typeof respObj.message === 'string') {
          message = [respObj.message];
        }
        if (typeof respObj.error === 'string') {
          error = respObj.error;
        } else {
          error = exception.name || 'Error';
        }
      }
    }

    const rawUrl = request.originalUrl ?? request.url ?? '';
    const sanitizedPath = rawUrl.split('?')[0];

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      path: sanitizedPath,
      timestamp: new Date().toISOString(),
    });
  }
}
