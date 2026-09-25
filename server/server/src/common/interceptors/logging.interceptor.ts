import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const method = request.method;
    const rawUrl = request.originalUrl ?? request.url ?? '';
    const path = rawUrl.split('?')[0];
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(`${method} ${path} ${statusCode} ${duration}ms`);
        },
        error: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;
          this.logger.warn(`${method} ${path} ${statusCode} ${duration}ms`);
        },
      }),
    );
  }
}
