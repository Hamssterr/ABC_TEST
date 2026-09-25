import type { ProcessingJobStatus } from '../../../database/enums/processing-job-status.enum.js';

export class RetryProcessingJobResponseDto {
  jobId!: string;
  quotationId!: string;
  status!: ProcessingJobStatus;
  attemptCount!: number;
  maxAttempts!: number;
}
