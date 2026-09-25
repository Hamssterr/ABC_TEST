import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module.js';
import { ProductsModule } from '../products/products.module.js';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { QuotationCandidateMatcherService } from './services/quotation-candidate-matcher.service.js';
import { GeminiQuotationDraftExtractor } from './extractors/gemini-quotation-draft.extractor.js';
import { QUOTATION_DRAFT_EXTRACTOR_TOKEN } from './extractors/quotation-draft-extractor.token.js';

@Module({
  imports: [CustomersModule, ProductsModule],
  controllers: [AiController],
  providers: [
    AiService,
    QuotationCandidateMatcherService,
    GeminiQuotationDraftExtractor,
    {
      provide: QUOTATION_DRAFT_EXTRACTOR_TOKEN,
      useClass: GeminiQuotationDraftExtractor,
    },
  ],
  exports: [AiService, QUOTATION_DRAFT_EXTRACTOR_TOKEN],
})
export class AiModule {}
