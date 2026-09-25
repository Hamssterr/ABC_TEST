import type { QuotationEntity } from '../enitities/quotation.entity.js';
import type { QuotationStatus } from '../../../database/enums/quotation-status.enum.js';
import type { ProcessingJobStatus } from '../../../database/enums/processing-job-status.enum.js';

export class QuotationListItemDto {
  quotationId!: string;
  quotationNumber!: string;
  status!: QuotationStatus;
  subtotal!: string;
  totalAmount!: string;
  validUntil!: string;
  jobStatus!: ProcessingJobStatus | null;
  createdAt!: Date;

  static fromEntity(entity: QuotationEntity): QuotationListItemDto {
    const dto = new QuotationListItemDto();
    dto.quotationId = entity.id;
    dto.quotationNumber = entity.quotationNumber;
    dto.status = entity.status;
    dto.subtotal = entity.subtotal;
    dto.totalAmount = entity.totalAmount;
    dto.validUntil = entity.validUntil;
    dto.jobStatus = entity.processingJob?.status ?? null;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
