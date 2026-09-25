import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor.js';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const frontendUrl = (
    configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
  ).replace(/\/+$/, '');

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableShutdownHooks();
}
