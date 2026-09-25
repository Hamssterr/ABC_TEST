import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  StreamableFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  QuotationsService,
  CreateQuotationResult,
} from './services/quotations.service.js';
import { CreateQuotationDto } from './dto/create-quotation.dto.js';
import { QuotationResponseDto } from './dto/quotation-response.dto.js';
import { QuotationListItemDto } from './dto/quotation-list-item.dto.js';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import {
  ApiResponse,
  ApiPaginatedResponse,
} from '../../common/interfaces/api-response.interface.js';

@Controller()
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post('customers/:customerId/quotations')
  @HttpCode(HttpStatus.ACCEPTED)
  async create(
    @Param('customerId', new ParseUUIDPipe({ version: '4' }))
    customerId: string,
    @Body() dto: CreateQuotationDto,
  ): Promise<ApiResponse<CreateQuotationResult>> {
    return this.quotationsService.create(customerId, dto);
  }

  @Get('customers/:customerId/quotations')
  async findCustomerQuotations(
    @Param('customerId', new ParseUUIDPipe({ version: '4' }))
    customerId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ApiPaginatedResponse<QuotationListItemDto>> {
    return this.quotationsService.findCustomerQuotations(customerId, query);
  }

  @Get('quotations/:id/download')
  async getDownloadUrl(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.quotationsService.getDownloadUrl(id);
  }

  @Get('quotations/:id/export.xlsx')
  async exportExcel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, fileName, mimeType } =
      await this.quotationsService.exportExcel(id);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    return new StreamableFile(buffer);
  }

  @Get('quotations/:id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<QuotationResponseDto>> {
    return this.quotationsService.findById(id);
  }
}
