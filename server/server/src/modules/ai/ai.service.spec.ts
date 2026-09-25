import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AiService } from './ai.service.js';
import { NotFoundException } from '@nestjs/common';

describe('AiService', () => {
  let service: AiService;
  let mockCustomersService: any;
  let mockCandidateMatcher: any;
  let mockExtractor: any;

  beforeEach(() => {
    mockCustomersService = {
      findById: vi.fn(),
    };
    mockCandidateMatcher = {
      matchCandidatesAndFields: vi.fn(),
    };
    mockExtractor = {
      extract: vi.fn(),
    };

    service = new AiService(
      mockCustomersService,
      mockCandidateMatcher,
      mockExtractor,
    );
  });

  it('should orchestrate customer validation, extraction, and candidate matching', async () => {
    mockCustomersService.findById.mockResolvedValueOnce({
      id: 'cus-1',
      name: 'John Doe',
    });
    mockExtractor.extract.mockResolvedValueOnce({
      items: [{ productQuery: 'Laptop', quantity: '1.00' }],
      deliveryAddress: '123 Test St',
      paymentTerms: 'COD',
      validityDays: 14,
      notes: null,
      unresolvedFields: [],
    });
    mockCandidateMatcher.matchCandidatesAndFields.mockResolvedValueOnce({
      items: [],
      deliveryAddress: '123 Test St',
      paymentTerms: 'COD',
      validityDays: 14,
      notes: null,
      unresolvedFields: [],
    });

    const result = await service.createDraft({
      customerId: 'cus-1',
      rawRequest: '  Need 1 Laptop  ',
    });

    expect(mockCustomersService.findById).toHaveBeenCalledWith('cus-1');
    expect(mockExtractor.extract).toHaveBeenCalledWith('Need 1 Laptop');
    expect(mockCandidateMatcher.matchCandidatesAndFields).toHaveBeenCalled();
    expect(result.message).toBe('Tạo bản nháp báo giá thành công');
    expect(result.data.deliveryAddress).toBe('123 Test St');
  });

  it('should throw NotFoundException if customer does not exist', async () => {
    mockCustomersService.findById.mockRejectedValueOnce(
      new NotFoundException('Customer with ID "non-existing" not found'),
    );

    await expect(
      service.createDraft({
        customerId: 'non-existing',
        rawRequest: 'Some text',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockExtractor.extract).not.toHaveBeenCalled();
    expect(
      mockCandidateMatcher.matchCandidatesAndFields,
    ).not.toHaveBeenCalled();
  });
});
