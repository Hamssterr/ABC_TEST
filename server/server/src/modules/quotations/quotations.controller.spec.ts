import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamableFile } from '@nestjs/common';
import { QuotationsController } from './quotations.controller.js';
import type { QuotationsService } from './services/quotations.service.js';
import type { Response } from 'express';

describe('QuotationsController', () => {
  let controller: QuotationsController;
  let service: Partial<QuotationsService>;

  beforeEach(() => {
    service = {
      exportExcel: vi.fn(),
      create: vi.fn(),
      findCustomerQuotations: vi.fn(),
      getDownloadUrl: vi.fn(),
      findById: vi.fn(),
    };

    controller = new QuotationsController(service as QuotationsService);
  });

  describe('exportExcel', () => {
    it('should set headers and return StreamableFile', async () => {
      const mockResult = {
        buffer: Buffer.from('mock-excel-binary'),
        fileName: 'quotation-QT-123.xlsx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      (service.exportExcel as any).mockResolvedValue(mockResult);

      const setSpy = vi.fn();
      const mockResponse = {
        set: setSpy,
      } as unknown as Response;

      const result = await controller.exportExcel('uuid-123', mockResponse);

      expect(service.exportExcel).toHaveBeenCalledWith('uuid-123');
      expect(setSpy).toHaveBeenCalledWith({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="quotation-QT-123.xlsx"',
        'Content-Length': mockResult.buffer.length.toString(),
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });
});
