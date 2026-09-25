import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service.js';
import type { QuotationCalculatorService } from './quotation-calculator.service.js';
import type { Repository, DataSource } from 'typeorm';
import type { QuotationEntity } from '../enitities/quotation.entity.js';
import type { CustomerEntity } from '../../customers/customer.entity.js';
import type { ProductEntity } from '../../products/product.entity.js';
import type { FileStorage } from '../../storage/storage.interface.js';
import type { QuotationExcelService } from '../../excel/quotation-excel.service.js';

describe('QuotationsService', () => {
  let service: QuotationsService;
  let quotationRepo: Partial<Repository<QuotationEntity>>;
  let customerRepo: Partial<Repository<CustomerEntity>>;
  let productRepo: Partial<Repository<ProductEntity>>;
  let calculatorService: Partial<QuotationCalculatorService>;
  let dataSource: Partial<DataSource>;
  let storage: Partial<FileStorage>;
  let excelService: Partial<QuotationExcelService>;

  beforeEach(() => {
    quotationRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      findAndCount: vi.fn(),
    };
    customerRepo = {
      findOne: vi.fn(),
    };
    productRepo = {
      find: vi.fn(),
    };
    calculatorService = {
      calculate: vi.fn(),
    };
    dataSource = {
      createQueryRunner: vi.fn(),
    };
    storage = {
      createSignedDownloadUrl: vi.fn(),
    };
    excelService = {
      generateExcel: vi.fn(),
    };

    service = new QuotationsService(
      quotationRepo as Repository<QuotationEntity>,
      customerRepo as Repository<CustomerEntity>,
      productRepo as Repository<ProductEntity>,
      calculatorService as QuotationCalculatorService,
      dataSource as DataSource,
      storage as FileStorage,
      excelService as QuotationExcelService,
    );
  });

  describe('create', () => {
    it('should throw NotFoundException if customer does not exist', async () => {
      (customerRepo.findOne as any).mockResolvedValue(null);

      await expect(
        service.create('c-uuid', {
          items: [{ productId: 'p-1', quantity: '2' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if duplicate productId exists in items', async () => {
      (customerRepo.findOne as any).mockResolvedValue({ id: 'c-uuid' });

      await expect(
        service.create('c-uuid', {
          items: [
            { productId: 'p-1', quantity: '1' },
            { productId: 'p-1', quantity: '2' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnprocessableEntityException if any product is invalid or inactive', async () => {
      (customerRepo.findOne as any).mockResolvedValue({ id: 'c-uuid' });
      (productRepo.find as any).mockResolvedValue([]); // returns 0 products

      await expect(
        service.create('c-uuid', {
          items: [{ productId: 'p-missing', quantity: '1' }],
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('exportExcel', () => {
    it('should throw NotFoundException if quotation does not exist', async () => {
      (quotationRepo.findOne as any).mockResolvedValue(null);

      await expect(service.exportExcel('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnprocessableEntityException if quotation has no items', async () => {
      (quotationRepo.findOne as any).mockResolvedValue({
        id: 'quote-1',
        quotationNumber: 'QT-1',
        items: [],
      });

      await expect(service.exportExcel('quote-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should call excelService.generateExcel and return result without updating database or storage', async () => {
      const mockQuotation = {
        id: 'quote-1',
        quotationNumber: 'QT-1',
        items: [{ id: 'item-1', productSku: 'SKU-1' }],
      };
      (quotationRepo.findOne as any).mockResolvedValue(mockQuotation);
      const expectedResult = {
        buffer: Buffer.from('mock-excel'),
        fileName: 'quotation-QT-1.xlsx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      (excelService.generateExcel as any).mockResolvedValue(expectedResult);

      const result = await service.exportExcel('quote-1');

      expect(quotationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'quote-1' },
        relations: { items: true },
      });
      expect(excelService.generateExcel).toHaveBeenCalledWith(mockQuotation);
      expect(result).toBe(expectedResult);
      expect(quotationRepo.save).not.toHaveBeenCalled();
      expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
    });
  });
});
