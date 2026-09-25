import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ProcessingJobEntity } from '../processing-job.entity.js';
import { QuotationEntity } from '../../quotations/enitities/quotation.entity.js';
import { QuotationPdfService } from '../../pdf/quotation-pdf.service.js';
import { FILE_STORAGE_TOKEN } from '../../storage/storage.token.js';
import type { FileStorage } from '../../storage/storage.interface.js';
import type {
  QuotationProcessor,
  ProcessorResult,
} from './quotation-processor.interface.js';

@Injectable()
export class MockMacProcessorService implements QuotationProcessor {
  private readonly logger = new Logger(MockMacProcessorService.name);

  constructor(
    @InjectRepository(QuotationEntity)
    private readonly quotationRepository: Repository<QuotationEntity>,
    private readonly pdfService: QuotationPdfService,
    @Inject(FILE_STORAGE_TOKEN)
    private readonly storage: FileStorage,
  ) {}

  async process(job: ProcessingJobEntity): Promise<ProcessorResult> {
    this.logger.log(
      `Processing job ${job.id} for quotation ${job.quotationId}`,
    );

    const quotation = await this.quotationRepository.findOne({
      where: { id: job.quotationId },
      relations: {
        items: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException(
        `Quotation with ID "${job.quotationId}" not found for job ${job.id}.`,
      );
    }

    if (!quotation.items || quotation.items.length === 0) {
      throw new BadRequestException(
        `Quotation with ID "${job.quotationId}" contains no items.`,
      );
    }

    // 1. Generate PDF
    const pdf = await this.pdfService.generatePdf(quotation);

    // 2. Deterministic object storage path
    const createdDate = quotation.createdAt
      ? new Date(quotation.createdAt)
      : new Date();
    const year = createdDate.getFullYear();
    const storagePath = `quotations/${year}/${quotation.id}/quotation-${quotation.quotationNumber}.pdf`;

    // 3. Upload to private storage
    const stored = await this.storage.uploadPdf({
      buffer: pdf.buffer,
      path: storagePath,
      fileName: pdf.fileName,
    });

    this.logger.log(
      `Job ${job.id} successfully generated and stored: ${stored.path}`,
    );

    return {
      filePath: stored.path,
      fileName: stored.fileName,
      fileChecksum: stored.checksum,
    };
  }
}
