import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import dotenv from 'dotenv';
import { AppConfigModule } from './config/app-config.module.js';
import { AppController } from './app.controller.js';
import { createTypeOrmOptions } from './database/data-source.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { QuotationsModule } from './modules/quotations/quotations.module.js';
import { ProcessingJobsModule } from './modules/processing-jobs/processing-jobs.module.js';
import { AiModule } from './modules/ai/ai.module.js';

dotenv.config();

const typeOrmImports = process.env.DATABASE_URL
  ? [
      TypeOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const databaseUrl = configService.get<string>('DATABASE_URL');
          const ssl = configService.get<boolean>('DATABASE_SSL');
          const poolMax = configService.get<number>('DATABASE_POOL_MAX');
          return createTypeOrmOptions({ databaseUrl, ssl, poolMax });
        },
      }),
    ]
  : [];

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    ...typeOrmImports,
    CustomersModule,
    ProductsModule,
    QuotationsModule,
    ProcessingJobsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
