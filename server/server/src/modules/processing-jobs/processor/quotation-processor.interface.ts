import type { ProcessingJobEntity } from '../processing-job.entity.js';

export interface ProcessorResult {
  filePath: string;
  fileName: string;
  fileChecksum: string;
}

export interface QuotationProcessor {
  process(job: ProcessingJobEntity): Promise<ProcessorResult>;
}
