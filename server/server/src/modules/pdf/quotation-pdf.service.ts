import { Injectable, BadRequestException } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { QuotationEntity } from '../quotations/enitities/quotation.entity.js';
import {
  defaultCompanyInfo,
  QuotationCompanyInfo,
} from './config/quotation-company.config.js';
import { renderQuotationV1 } from './templates/quotation-v1.template.js';

export interface GeneratedPdfResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

@Injectable()
export class QuotationPdfService {
  private regularFontBytes: Buffer | null = null;
  private boldFontBytes: Buffer | null = null;
  private companyInfo: QuotationCompanyInfo = defaultCompanyInfo;

  private resolveFontPath(fileName: string): string {
    let currentDir = process.cwd();
    try {
      if (typeof __dirname !== 'undefined') {
        currentDir = __dirname;
      } else if (import.meta.url) {
        currentDir = path.dirname(fileURLToPath(import.meta.url));
      }
    } catch {
      currentDir = process.cwd();
    }

    const candidates = [
      path.resolve(currentDir, '../../assets/fonts', fileName),
      path.resolve(currentDir, '../assets/fonts', fileName),
      path.resolve(process.cwd(), 'dist/assets/fonts', fileName),
      path.resolve(process.cwd(), 'src/assets/fonts', fileName),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return cand;
      }
    }

    throw new Error(`Font asset "${fileName}" not found in candidate paths.`);
  }

  private loadFontBytes(): { regular: Buffer; bold: Buffer } {
    if (!this.regularFontBytes) {
      const regPath = this.resolveFontPath('NotoSans-Regular.ttf');
      this.regularFontBytes = fs.readFileSync(regPath);
    }
    if (!this.boldFontBytes) {
      const boldPath = this.resolveFontPath('NotoSans-Bold.ttf');
      this.boldFontBytes = fs.readFileSync(boldPath);
    }
    return { regular: this.regularFontBytes, bold: this.boldFontBytes };
  }

  async generatePdf(quotation: QuotationEntity): Promise<GeneratedPdfResult> {
    const version = quotation.templateVersion || 'v1';
    if (version !== 'v1') {
      throw new BadRequestException(
        `Unsupported quotation template version "${version}". Only "v1" is supported.`,
      );
    }

    const { regular, bold } = this.loadFontBytes();
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontRegular = await pdfDoc.embedFont(regular);
    const fontBold = await pdfDoc.embedFont(bold);

    await renderQuotationV1(
      pdfDoc,
      quotation,
      this.companyInfo,
      fontRegular,
      fontBold,
    );

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    const fileName = `quotation-${quotation.quotationNumber}.pdf`;

    return {
      buffer,
      fileName,
      mimeType: 'application/pdf',
    };
  }
}
