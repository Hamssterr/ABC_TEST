import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';
import { UnprocessableEntityException } from '@nestjs/common';
import { QuotationExcelService } from './quotation-excel.service.js';
import type { QuotationEntity } from '../quotations/enitities/quotation.entity.js';
import type { QuotationItemEntity } from '../quotations/enitities/quotation-item.entity.js';
import { defaultCompanyInfo } from '../pdf/config/quotation-company.config.js';
import { QuotationStatus } from '../../database/enums/quotation-status.enum.js';

describe('QuotationExcelService', () => {
  let service: QuotationExcelService;

  beforeEach(() => {
    service = new QuotationExcelService();
  });

  const createMockQuotation = (
    overrides?: Partial<QuotationEntity>,
  ): QuotationEntity => {
    const items: QuotationItemEntity[] = [
      {
        id: 'item-1',
        quotationId: 'quote-uuid-1',
        productId: 'prod-1',
        productSku: 'SKU-LAPTOP-01',
        productName: 'Laptop Dell Latitude 7420',
        description: 'Intel Core i7, 16GB RAM, 512GB SSD',
        unit: 'chiếc',
        quantity: '2.00',
        unitPrice: '25000000.00',
        lineTotal: '50000000.00',
        quotation: {} as any,
        product: {} as any,
      },
      {
        id: 'item-2',
        quotationId: 'quote-uuid-1',
        productId: 'prod-2',
        productSku: 'SKU-MOUSE-02',
        productName: 'Chuột không dây Logitech MX Master 3',
        description: 'Chuột laser công thái học cao cấp',
        unit: 'cái',
        quantity: '2.00',
        unitPrice: '2500000.00',
        lineTotal: '5000000.00',
        quotation: {} as any,
        product: {} as any,
      },
      {
        id: 'item-3',
        quotationId: 'quote-uuid-1',
        productId: 'prod-3',
        productSku: 'SKU-SCREEN-03',
        productName: 'Màn hình Dell UltraSharp U2723QE',
        description: 'Màn hình 27 inch 4K IPS Black',
        unit: 'chiếc',
        quantity: '1.00',
        unitPrice: '14500000.00',
        lineTotal: '14500000.00',
        quotation: {} as any,
        product: {} as any,
      },
    ];

    return {
      id: 'quote-uuid-1',
      quotationNumber: 'QT-20260923-ABCD',
      customerId: 'cust-uuid-1',
      customerSnapshot: {
        id: 'cust-uuid-1',
        code: 'CUS-001',
        name: 'Nguyễn Văn An',
        companyName: 'Công ty Cổ phần Giải pháp Công nghệ Việt',
        email: 'an.nguyen@viet-tech.example.vn',
        phone: '0901234567',
        address: '456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      },
      status: QuotationStatus.SUBMITTED,
      subtotal: '69500000.00',
      discountAmount: '2000000.00',
      taxRate: '10.00',
      taxAmount: '6750000.00',
      totalAmount: '74250000.00',
      validUntil: '2026-10-23',
      deliveryAddress: 'Kho số 2, Khu công nghệ cao TP. Thủ Đức',
      paymentTerms:
        'Thanh toán 50% ngay sau khi ký hợp đồng, 50% sau khi bàn giao nghiệm thu',
      notes: 'Hàng chính hãng bảo hành 24 tháng tận nơi',
      templateVersion: 'v1',
      createdAt: new Date('2026-09-23T08:00:00.000Z'),
      updatedAt: new Date('2026-09-23T08:00:00.000Z'),
      customer: {} as any,
      items,
      ...overrides,
    };
  };

  it('should generate valid Excel result with non-empty buffer, correct filename, and MIME type', async () => {
    const mockQuotation = createMockQuotation();
    const result = await service.generateExcel(mockQuotation);

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.fileName).toBe('quotation-QT-20260923-ABCD.xlsx');
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('should generate a workbook that can be loaded back by ExcelJS', async () => {
    const mockQuotation = createMockQuotation();
    const result = await service.generateExcel(mockQuotation);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as any);

    expect(workbook.worksheets.length).toBeGreaterThan(0);
    const worksheet = workbook.getWorksheet('Báo giá');
    expect(worksheet).toBeDefined();
  });

  it('should contain company information in worksheet', async () => {
    const mockQuotation = createMockQuotation();
    const result = await service.generateExcel(mockQuotation);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as any);
    const ws = workbook.getWorksheet('Báo giá')!;

    expect(ws.getCell('A1').value).toBe(defaultCompanyInfo.name);
    expect(ws.getCell('A2').text).toContain(defaultCompanyInfo.address);
    expect(ws.getCell('A3').text).toContain(defaultCompanyInfo.phone);
    expect(ws.getCell('A3').text).toContain(defaultCompanyInfo.email);
    expect(ws.getCell('A3').text).toContain(defaultCompanyInfo.taxCode);
  });

  it('should contain document title and quotation metadata', async () => {
    const mockQuotation = createMockQuotation();
    const result = await service.generateExcel(mockQuotation);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as any);
    const ws = workbook.getWorksheet('Báo giá')!;

    expect(ws.getCell('A5').value).toBe('BÁO GIÁ');
    expect(ws.getCell('A7').text).toContain('QT-20260923-ABCD');
    expect(ws.getCell('E7').text).toContain('23/09/2026');
    expect(ws.getCell('E8').text).toContain('23/10/2026');
  });

  it('should contain customer snapshot information without undefined or null strings', async () => {
    const mockQuotation = createMockQuotation();
    const result = await service.generateExcel(mockQuotation);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as any);
    const ws = workbook.getWorksheet('Báo giá')!;

    const nameText = ws.getCell('A8').text;
    const compText = ws.getCell('A9').text;
    const codeText = ws.getCell('E9').text;
    const contactText = ws.getCell('A10').text;
    const addrText = ws.getCell('E10').text;

    expect(nameText).toContain('Nguyễn Văn An');
    expect(compText).toContain('Công ty Cổ phần Giải pháp Công nghệ Việt');
    expect(codeText).toContain('CUS-001');
    expect(contactText).toContain('an.nguyen@viet-tech.example.vn');
    expect(contactText).toContain('0901234567');
    expect(addrText).toContain('456 Đường Lê Lợi');

    // Ensure no 'undefined' or 'null' appears
    expect(nameText).not.toContain('undefined');
    expect(nameText).not.toContain('null');
    expect(compText).not.toContain('undefined');
    expect(compText).not.toContain('null');
    expect(contactText).not.toContain('undefined');
    expect(contactText).not.toContain('null');
  });

  it('should safely handle customer snapshot with nullable or missing fields', async () => {
    const mockQuotation = createMockQuotation({
      customerSnapshot: {
        id: 'cust-uuid-2',
        code: 'CUS-002',
        name: 'Trần Thị B',
        companyName: null,
        email: null,
        phone: null,
        address: null,
      },
      deliveryAddress: null,
      paymentTerms: null,
      notes: null,
    });

    const result = await service.generateExcel(mockQuotation);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as any);
    const ws = workbook.getWorksheet('Báo giá')!;

    const compText = ws.getCell('A9').text;
    const contactText = ws.getCell('A10').text;
    const addrText = ws.getCell('E10').text;

    expect(compText).toContain('-');
    expect(contactText).toContain('-');
    expect(addrText).toContain('-');
    expect(compText).not.toContain('null');
    expect(contactText).not.toContain('null');
    expect(addrText).not.toContain('null');
  });

  it('should contain all product items with SKU, name, quantities and numeric prices', async () => {
    const mockQuotation = createMockQuotation();
    const result = await service.generateExcel(mockQuotation);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as any);
    const ws = workbook.getWorksheet('Báo giá')!;

    // Table header row 12
    expect(ws.getCell('A12').value).toBe('STT');
    expect(ws.getCell('B12').value).toBe('Mã SKU');
    expect(ws.getCell('C12').value).toBe('Tên sản phẩm');
    expect(ws.getCell('H12').value).toBe('Thành tiền (VNĐ)');

    // Row 13: Item 1
    expect(ws.getCell('A13').value).toBe(1);
    expect(ws.getCell('B13').value).toBe('SKU-LAPTOP-01');
    expect(ws.getCell('C13').value).toBe('Laptop Dell Latitude 7420');
    expect(ws.getCell('F13').value).toBe(2);
    expect(ws.getCell('G13').value).toBe(25000000);
    expect(ws.getCell('H13').value).toBe(50000000);

    // Row 14: Item 2
    expect(ws.getCell('B14').value).toBe('SKU-MOUSE-02');
    expect(ws.getCell('H14').value).toBe(5000000);

    // Row 15: Item 3
    expect(ws.getCell('B15').value).toBe('SKU-SCREEN-03');
    expect(ws.getCell('H15').value).toBe(14500000);
  });

  it('should contain subtotal, discount, tax and total amount correctly', async () => {
    const mockQuotation = createMockQuotation();
    const result = await service.generateExcel(mockQuotation);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as any);
    const ws = workbook.getWorksheet('Báo giá')!;

    // Items are on rows 13, 14, 15
    // Row 16: Subtotal
    expect(ws.getCell('A16').text).toContain('Cộng tiền hàng');
    expect(ws.getCell('H16').value).toBe(69500000);

    // Row 17: Discount
    expect(ws.getCell('A17').text).toContain('Chiết khấu');
    expect(ws.getCell('H17').value).toBe(2000000);

    // Row 18: Tax
    expect(ws.getCell('A18').text).toContain('Thuế GTGT (10.00% VAT)');
    expect(ws.getCell('H18').value).toBe(6750000);

    // Row 19: Total
    expect(ws.getCell('A19').text).toContain('TỔNG CỘNG THANH TOÁN');
    expect(ws.getCell('H19').value).toBe(74250000);
  });

  it('should configure landscape page setup and freeze pane', async () => {
    const mockQuotation = createMockQuotation();
    const result = await service.generateExcel(mockQuotation);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(result.buffer as any);
    const ws = workbook.getWorksheet('Báo giá')!;

    expect(ws.pageSetup.orientation).toBe('landscape');
    expect(ws.pageSetup.paperSize).toBe(9); // A4
    expect(ws.pageSetup.fitToWidth).toBe(1);
    expect(ws.views).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ state: 'frozen', ySplit: 12 }),
      ]),
    );
  });

  it('should throw UnprocessableEntityException if quotation has no items', async () => {
    const mockQuotation = createMockQuotation({ items: [] });
    await expect(service.generateExcel(mockQuotation)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });
});
