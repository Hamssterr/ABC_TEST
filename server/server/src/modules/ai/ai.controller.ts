import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { CreateQuotationDraftDto } from './dto/create-quotation-draft.dto.js';
import { QuotationDraftResponseDto } from './dto/quotation-draft-response.dto.js';
import { ApiResponse } from '../../common/interfaces/api-response.interface.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('quotation-draft')
  @HttpCode(HttpStatus.OK)
  async createQuotationDraft(
    @Body() dto: CreateQuotationDraftDto,
  ): Promise<ApiResponse<QuotationDraftResponseDto>> {
    return this.aiService.createDraft(dto);
  }
}
