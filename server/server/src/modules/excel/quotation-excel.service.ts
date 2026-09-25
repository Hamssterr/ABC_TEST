import {
  Injectable,
  UnprocessableEntityException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { QuotationEntity } from '../quotations/enitities/quotation.entity.js';
import {
  defaultCompanyInfo,
  type QuotationCompanyInfo,
} from '../pdf/config/quotation-company.config.js';
import { renderQuotationExcelV1 } from './templates/quotation-excel-v1.template.js';
import type { GeneratedExcelResult } from './interfaces/generated-excel-result.interface.js';

@Injectable()
export class QuotationExcelService {
  private readonly logger = new Logger(QuotationExcelService.name);
  private readonly companyInfo: QuotationCompanyInfo = defaultCompanyInfo;

  async generateExcel(
    quotation: QuotationEntity,
  ): Promise<GeneratedExcelResult> {
    if (!quotation) {
      throw new UnprocessableEntityException(
        'Quotation data is required for Excel export',
      );
    }

    if (!quotation.items || quotation.items.length === 0) {
      throw new UnprocessableEntityException(
        'Quotation contains no items for export',
      );
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = this.companyInfo.name;
      workbook.created = quotation.createdAt
        ? new Date(quotation.createdAt)
        : new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet('Báo giá', {
        views: [{ showGridLines: true }],
      });

      renderQuotationExcelV1(worksheet, quotation, this.companyInfo);

      const rawBuffer = await workbook.xlsx.writeBuffer();
      const buffer = Buffer.isBuffer(rawBuffer)
        ? rawBuffer
        : Buffer.from(rawBuffer);

      const safeQuotationNumber = (
        quotation.quotationNumber || 'export'
      ).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `quotation-${safeQuotationNumber}.xlsx`;

      return {
        buffer,
        fileName,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      this.logger.error(
        `Failed to generate quotation Excel for quotation ${quotation.quotationNumber}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to generate quotation Excel file',
      );
    }
  }
}
