import { QuotationDraftItemDto } from './quotation-draft-item.dto.js';

export class QuotationDraftResponseDto {
  items!: QuotationDraftItemDto[];
  deliveryAddress!: string | null;
  paymentTerms!: string | null;
  validityDays!: number | null;
  notes!: string | null;
  unresolvedFields!: string[];
}
