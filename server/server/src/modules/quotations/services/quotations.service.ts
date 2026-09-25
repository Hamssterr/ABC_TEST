import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { QuotationEntity } from '../enitities/quotation.entity.js';
import { QuotationItemEntity } from '../enitities/quotation-item.entity.js';
import { ProcessingJobEntity } from '../../processing-jobs/processing-job.entity.js';
import { CustomerEntity } from '../../customers/customer.entity.js';
import { ProductEntity } from '../../products/product.entity.js';
import { QuotationStatus } from '../../../database/enums/quotation-status.enum.js';
import { ProcessingJobStatus } from '../../../database/enums/processing-job-status.enum.js';
import { ProcessorType } from '../../../database/enums/processor-type.enum.js';
import { QuotationCalculatorService } from './quotation-calculator.service.js';
import { CreateQuotationDto } from '../dto/create-quotation.dto.js';
import { QuotationResponseDto } from '../dto/quotation-response.dto.js';
import { QuotationListItemDto } from '../dto/quotation-list-item.dto.js';
import { QuotationDownloadResponseDto } from '../dto/quotation-download-response.dto.js';
import type { CustomerSnapshot } from '../types/customer-snapshot.type.js';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto.js';
import {
  ApiResponse,
  ApiPaginatedResponse,
} from '../../../common/interfaces/api-response.interface.js';
import {
  buildPaginatedResponse,
  getPaginationSkipTake,
} from '../../../common/pagination/pagination.util.js';
import { FILE_STORAGE_TOKEN } from '../../storage/storage.token.js';
import type { FileStorage } from '../../storage/storage.interface.js';
import { QuotationExcelService } from '../../excel/quotation-excel.service.js';
import type { GeneratedExcelResult } from '../../excel/interfaces/generated-excel-result.interface.js';

export interface CreateQuotationResult {
  quotationId: string;
  quotationNumber: string;
  jobId: string;
  status: ProcessingJobStatus;
}

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(QuotationEntity)
    private readonly quotationRepository: Repository<QuotationEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly calculatorService: QuotationCalculatorService,
    private readonly dataSource: DataSource,
    @Inject(FILE_STORAGE_TOKEN)
    private readonly storage: FileStorage,
    private readonly excelService: QuotationExcelService,
  ) {}

  private generateQuotationNumber(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = randomUUID()
      .replace(/-/g, '')
      .slice(0, 4)
      .toUpperCase();
    return `QT-${today}-${randomSuffix}`;
  }

  async create(
    customerId: string,
    dto: CreateQuotationDto,
  ): Promise<ApiResponse<CreateQuotationResult>> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${customerId}" not found`);
    }

    const productIds = dto.items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException(
        'Duplicate productId found in quotation items',
      );
    }

    const products = await this.productRepository.find({
      where: {
        id: In(productIds),
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new UnprocessableEntityException(
        `The following products are invalid, inactive, or not found: ${missingIds.join(', ')}`,
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const calculatorItems = dto.items.map((item) => ({
      product: productMap.get(item.productId)!,
      quantity: item.quantity,
    }));

    const calculation = this.calculatorService.calculate(
      calculatorItems,
      dto.discountAmount ?? '0.00',
      dto.taxRate ?? '10.00',
    );

    const customerSnapshot: CustomerSnapshot = {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      companyName: customer.companyName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    };

    let quotationNumber = this.generateQuotationNumber();
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts += 1;
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const quotation = queryRunner.manager.create(QuotationEntity, {
          quotationNumber,
          customerId: customer.id,
          customerSnapshot: customerSnapshot as unknown as Record<
            string,
            unknown
          >,
          status: QuotationStatus.SUBMITTED,
          subtotal: calculation.subtotal,
          discountAmount: calculation.discountAmount,
          taxRate: calculation.taxRate,
          taxAmount: calculation.taxAmount,
          totalAmount: calculation.totalAmount,
          validUntil: dto.validUntil,
          deliveryAddress: dto.deliveryAddress?.trim() ?? null,
          paymentTerms: dto.paymentTerms?.trim() ?? null,
          notes: dto.notes?.trim() ?? null,
          templateVersion: 'v1',
        });

        const savedQuotation = await queryRunner.manager.save(quotation);

        const quotationItems = calculation.items.map((item) =>
          queryRunner.manager.create(QuotationItemEntity, {
            quotationId: savedQuotation.id,
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          }),
        );

        await queryRunner.manager.save(quotationItems);

        const job = queryRunner.manager.create(ProcessingJobEntity, {
          quotationId: savedQuotation.id,
          processorType: ProcessorType.HOSTED_MOCK,
          status: ProcessingJobStatus.PENDING,
          attemptCount: 0,
        });

        const savedJob = await queryRunner.manager.save(job);

        await queryRunner.commitTransaction();

        return {
          message: 'Gửi yêu cầu tạo báo giá thành công',
          data: {
            quotationId: savedQuotation.id,
            quotationNumber: savedQuotation.quotationNumber,
            jobId: savedJob.id,
            status: savedJob.status,
          },
        };
      } catch (error: any) {
        await queryRunner.rollbackTransaction();

        const isUniqueViolation =
          error?.code === '23505' || error?.driverError?.code === '23505';

        if (isUniqueViolation && attempts < maxAttempts) {
          quotationNumber = this.generateQuotationNumber();
          continue;
        }

        if (isUniqueViolation) {
          throw new ConflictException(
            'Failed to generate unique quotation number after multiple attempts',
          );
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    throw new ConflictException('Failed to generate unique quotation number');
  }

  async findById(id: string): Promise<ApiResponse<QuotationResponseDto>> {
    const quotation = await this.quotationRepository.findOne({
      where: { id },
      relations: {
        items: true,
        processingJob: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID "${id}" not found`);
    }

    return {
      message: 'Lấy thông tin báo giá thành công',
      data: QuotationResponseDto.fromEntity(quotation),
    };
  }

  async findCustomerQuotations(
    customerId: string,
    query: PaginationQueryDto,
  ): Promise<ApiPaginatedResponse<QuotationListItemDto>> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${customerId}" not found`);
    }

    const { skip, take } = getPaginationSkipTake(query.page, query.limit);

    const [quotations, total] = await this.quotationRepository.findAndCount({
      where: { customerId },
      relations: {
        processingJob: true,
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
      skip,
      take,
    });

    const paginated = buildPaginatedResponse(
      quotations.map((q) => QuotationListItemDto.fromEntity(q)),
      total,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy lịch sử báo giá thành công',
      data: paginated.data,
      meta: paginated.meta,
    };
  }

  async getDownloadUrl(
    id: string,
  ): Promise<ApiResponse<QuotationDownloadResponseDto>> {
    const quotation = await this.quotationRepository.findOne({
      where: { id },
      relations: {
        processingJob: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID "${id}" not found`);
    }

    const job = quotation.processingJob;
    if (!job || job.status !== ProcessingJobStatus.COMPLETED || !job.filePath) {
      const currentStatus = job?.status ?? 'NONE';
      throw new ConflictException(
        `Quotation PDF is not ready for download. Current processing status: "${currentStatus}".`,
      );
    }

    const expiresIn = 300;
    const downloadUrl = await this.storage.createSignedDownloadUrl(
      job.filePath,
      expiresIn,
    );

    return {
      message: 'Tạo link tải báo giá thành công',
      data: {
        fileName: job.fileName || `quotation-${quotation.quotationNumber}.pdf`,
        downloadUrl,
        expiresIn,
      },
    };
  }

  async exportExcel(id: string): Promise<GeneratedExcelResult> {
    const quotation = await this.quotationRepository.findOne({
      where: { id },
      relations: {
        items: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID "${id}" not found`);
    }

    if (!quotation.items || quotation.items.length === 0) {
      throw new UnprocessableEntityException(
        'Quotation contains no items for export',
      );
    }

    return this.excelService.generateExcel(quotation);
  }
}
