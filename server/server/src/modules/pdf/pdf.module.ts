import { Module } from '@nestjs/common';
import { QuotationPdfService } from './quotation-pdf.service.js';

@Module({
  providers: [QuotationPdfService],
  exports: [QuotationPdfService],
})
export class PdfModule {}
