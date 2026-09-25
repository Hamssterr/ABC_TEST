import { Injectable, Inject, Logger } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service.js';
import { QUOTATION_DRAFT_EXTRACTOR_TOKEN } from './extractors/quotation-draft-extractor.token.js';
import type { QuotationDraftExtractor } from './extractors/quotation-draft-extractor.interface.js';
import { CreateQuotationDraftDto } from './dto/create-quotation-draft.dto.js';
import { QuotationDraftResponseDto } from './dto/quotation-draft-response.dto.js';
import { QuotationCandidateMatcherService } from './services/quotation-candidate-matcher.service.js';
import { ApiResponse } from '../../common/interfaces/api-response.interface.js';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly customersService: CustomersService,
    private readonly candidateMatcher: QuotationCandidateMatcherService,
    @Inject(QUOTATION_DRAFT_EXTRACTOR_TOKEN)
    private readonly extractor: QuotationDraftExtractor,
  ) {}

  async createDraft(
    dto: CreateQuotationDraftDto,
  ): Promise<ApiResponse<QuotationDraftResponseDto>> {
    // 1. Validate customer exists and is not soft-deleted
    await this.customersService.findById(dto.customerId);

    // 2. Call extractor with trimmed rawRequest
    const extracted = await this.extractor.extract(dto.rawRequest.trim());

    // 3. Match candidate products and aggregate unresolved fields
    const draftData =
      await this.candidateMatcher.matchCandidatesAndFields(extracted);

    return {
      message: 'Tạo bản nháp báo giá thành công',
      data: draftData,
    };
  }
}
