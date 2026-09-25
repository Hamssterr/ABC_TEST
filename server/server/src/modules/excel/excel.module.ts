import { Module } from '@nestjs/common';
import { QuotationExcelService } from './quotation-excel.service.js';

@Module({
  providers: [QuotationExcelService],
  exports: [QuotationExcelService],
})
export class ExcelModule {}
