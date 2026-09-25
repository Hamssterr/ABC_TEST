import type { QuotationEntity } from '../enitities/quotation.entity.js';
import { QuotationItemResponseDto } from './quotation-item-response.dto.js';
import type { QuotationStatus } from '../../../database/enums/quotation-status.enum.js';
import type { ProcessingJobStatus } from '../../../database/enums/processing-job-status.enum.js';

export class QuotationProcessingJobSummaryDto {
  id!: string;
  status!: ProcessingJobStatus;
  attemptCount!: number;
  errorMessage!: string | null;
  fileName!: string | null;
  completedAt!: Date | null;
}

export class QuotationResponseDto {
  id!: string;
  quotationNumber!: string;
  customerId!: string;
  customerSnapshot!: Record<string, unknown>;
  status!: QuotationStatus;
  subtotal!: string;
  discountAmount!: string;
  taxRate!: string;
  taxAmount!: string;
  totalAmount!: string;
  validUntil!: string;
  deliveryAddress!: string | null;
  paymentTerms!: string | null;
  notes!: string | null;
  templateVersion!: string;
  items!: QuotationItemResponseDto[];
  processingJob!: QuotationProcessingJobSummaryDto | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: QuotationEntity): QuotationResponseDto {
    const dto = new QuotationResponseDto();
    dto.id = entity.id;
    dto.quotationNumber = entity.quotationNumber;
    dto.customerId = entity.customerId;
    dto.customerSnapshot = entity.customerSnapshot;
    dto.status = entity.status;
    dto.subtotal = entity.subtotal;
    dto.discountAmount = entity.discountAmount;
    dto.taxRate = entity.taxRate;
    dto.taxAmount = entity.taxAmount;
    dto.totalAmount = entity.totalAmount;
    dto.validUntil = entity.validUntil;
    dto.deliveryAddress = entity.deliveryAddress;
    dto.paymentTerms = entity.paymentTerms;
    dto.notes = entity.notes;
    dto.templateVersion = entity.templateVersion;
    dto.items = (entity.items ?? []).map((item) =>
      QuotationItemResponseDto.fromEntity(item),
    );
    dto.processingJob = entity.processingJob
      ? {
          id: entity.processingJob.id,
          status: entity.processingJob.status,
          attemptCount: entity.processingJob.attemptCount,
          errorMessage: entity.processingJob.errorMessage,
          fileName: entity.processingJob.fileName,
          completedAt: entity.processingJob.completedAt,
        }
      : null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
