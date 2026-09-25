import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessingJobsController } from './processing-jobs.controller.js';
import { ProcessingJobsService } from './services/processing-jobs.service.js';
import { ProcessingJobRunner } from './services/processing-job-runner.service.js';
import { MockMacProcessorService } from './processor/mock-mac-processor.service.js';
import { QUOTATION_PROCESSOR_TOKEN } from './processor/quotation-processor.token.js';
import { ProcessingJobEntity } from './processing-job.entity.js';
import { QuotationEntity } from '../quotations/enitities/quotation.entity.js';
import { PdfModule } from '../pdf/pdf.module.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessingJobEntity, QuotationEntity]),
    PdfModule,
    StorageModule,
  ],
  controllers: [ProcessingJobsController],
  providers: [
    ProcessingJobsService,
    ProcessingJobRunner,
    MockMacProcessorService,
    {
      provide: QUOTATION_PROCESSOR_TOKEN,
      useExisting: MockMacProcessorService,
    },
  ],
  exports: [
    ProcessingJobsService,
    QUOTATION_PROCESSOR_TOKEN,
    MockMacProcessorService,
  ],
})
export class ProcessingJobsModule {}
