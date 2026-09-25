import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationsController } from './quotations.controller.js';
import { QuotationsService } from './services/quotations.service.js';
import { QuotationCalculatorService } from './services/quotation-calculator.service.js';
import { QuotationEntity } from './enitities/quotation.entity.js';
import { QuotationItemEntity } from './enitities/quotation-item.entity.js';
import { ProcessingJobEntity } from '../processing-jobs/processing-job.entity.js';
import { CustomerEntity } from '../customers/customer.entity.js';
import { ProductEntity } from '../products/product.entity.js';
import { StorageModule } from '../storage/storage.module.js';
import { ExcelModule } from '../excel/excel.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuotationEntity,
      QuotationItemEntity,
      ProcessingJobEntity,
      CustomerEntity,
      ProductEntity,
    ]),
    StorageModule,
    ExcelModule,
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService, QuotationCalculatorService],
  exports: [QuotationsService, QuotationCalculatorService],
})
export class QuotationsModule {}
