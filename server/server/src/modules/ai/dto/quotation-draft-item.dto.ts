import { ProductCandidateDto } from './product-candidate.dto.js';

export class QuotationDraftItemDto {
  productQuery!: string;
  quantity!: string | null;
  candidates!: ProductCandidateDto[];
}
