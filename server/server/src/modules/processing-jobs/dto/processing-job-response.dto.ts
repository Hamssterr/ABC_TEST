import type { ProcessingJobEntity } from '../processing-job.entity.js';
import type { ProcessingJobStatus } from '../../../database/enums/processing-job-status.enum.js';

export class ProcessingJobResponseDto {
  id!: string;
  quotationId!: string;
  status!: ProcessingJobStatus;
  attemptCount!: number;
  maxAttempts!: number;
  errorMessage!: string | null;
  fileName!: string | null;
  completedAt!: Date | null;

  static fromEntity(entity: ProcessingJobEntity): ProcessingJobResponseDto {
    const dto = new ProcessingJobResponseDto();
    dto.id = entity.id;
    dto.quotationId = entity.quotationId;
    dto.status = entity.status;
    dto.attemptCount = entity.attemptCount;
    dto.maxAttempts = 3;
    dto.errorMessage = entity.errorMessage;
    dto.fileName = entity.fileName;
    dto.completedAt = entity.completedAt;
    return dto;
  }
}
