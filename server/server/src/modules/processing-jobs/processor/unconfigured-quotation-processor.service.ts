import { Injectable } from '@nestjs/common';
import type { ProcessingJobEntity } from '../processing-job.entity.js';
import type {
  QuotationProcessor,
  ProcessorResult,
} from './quotation-processor.interface.js';

@Injectable()
export class UnconfiguredQuotationProcessor implements QuotationProcessor {
  async process(job: ProcessingJobEntity): Promise<ProcessorResult> {
    throw new Error(
      `Quotation processor is not configured. Job ${job.id} cannot be processed in Phase 7.`,
    );
  }
}
