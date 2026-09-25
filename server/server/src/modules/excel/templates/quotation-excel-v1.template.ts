import type ExcelJS from 'exceljs';
import type { QuotationEntity } from '../../quotations/enitities/quotation.entity.js';
import type { QuotationCompanyInfo } from '../../pdf/config/quotation-company.config.js';
import type { CustomerSnapshot } from '../../quotations/types/customer-snapshot.type.js';

function formatDate(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return '-';
  if (typeof dateVal === 'string') {
    // If format is YYYY-MM-DD
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateVal);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function renderQuotationExcelV1(
  worksheet: ExcelJS.Worksheet,
  quotation: QuotationEntity,
  companyInfo: QuotationCompanyInfo,
): void {
  // 1. Column definitions and widths (8 columns: A to H)
  worksheet.columns = [
    { key: 'stt', width: 6 },
    { key: 'sku', width: 14 },
    { key: 'productName', width: 30 },
    { key: 'description', width: 32 },
    { key: 'unit', width: 10 },
    { key: 'quantity', width: 13 },
    { key: 'unitPrice', width: 18 },
    { key: 'lineTotal', width: 20 },
  ];

  // Colors
  const primaryNavy = '1E3A8A';
  const lightGray = 'F8FAFC';
  const borderGray = 'CBD5E1';
  const summaryHighlight = 'EFF6FF';

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: borderGray } },
    left: { style: 'thin', color: { argb: borderGray } },
    bottom: { style: 'thin', color: { argb: borderGray } },
    right: { style: 'thin', color: { argb: borderGray } },
  };

  // 2. Company Header (Rows 1-3)
  worksheet.mergeCells('A1:H1');
  const row1 = worksheet.getCell('A1');
  row1.value = companyInfo.name;
  row1.font = {
    name: 'Arial',
    size: 13,
    bold: true,
    color: { argb: '0F172A' },
  };
  row1.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(1).height = 22;

  worksheet.mergeCells('A2:H2');
  const row2 = worksheet.getCell('A2');
  row2.value = `Địa chỉ: ${companyInfo.address}`;
  row2.font = { name: 'Arial', size: 9.5, color: { argb: '475569' } };
  row2.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(2).height = 18;

  worksheet.mergeCells('A3:H3');
  const row3 = worksheet.getCell('A3');
  row3.value = `Điện thoại: ${companyInfo.phone}  |  Email: ${companyInfo.email}  |  Mã số thuế: ${companyInfo.taxCode}`;
  row3.font = { name: 'Arial', size: 9.5, color: { argb: '475569' } };
  row3.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(3).height = 18;

  // Row 4: Spacing
  worksheet.getRow(4).height = 10;

  // 3. Document Title (Row 5)
  worksheet.mergeCells('A5:H5');
  const titleCell = worksheet.getCell('A5');
  titleCell.value = 'BÁO GIÁ';
  titleCell.font = {
    name: 'Arial',
    size: 18,
    bold: true,
    color: { argb: primaryNavy },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(5).height = 32;

  // Row 6: Spacing
  worksheet.getRow(6).height = 10;

  // 4. Quotation Metadata & Customer Snapshot (Rows 7-10)
  const snapshot = (quotation.customerSnapshot ||
    {}) as Partial<CustomerSnapshot>;
  const customerName = snapshot.name || '-';
  const customerCode = snapshot.code || '-';
  const customerCompanyName = snapshot.companyName || '-';
  const customerEmail = snapshot.email || '-';
  const customerPhone = snapshot.phone || '-';
  const customerAddress = snapshot.address || '-';

  const infoLabelFont = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: '1E293B' },
  };
  const infoValFont = { name: 'Arial', size: 10, color: { argb: '334155' } };

  // Row 7
  worksheet.mergeCells('A7:D7');
  const qNumCell = worksheet.getCell('A7');
  qNumCell.value = `Số báo giá: ${quotation.quotationNumber}`;
  qNumCell.font = infoLabelFont;

  worksheet.mergeCells('E7:H7');
  const qDateCell = worksheet.getCell('E7');
  qDateCell.value = `Ngày tạo: ${formatDate(quotation.createdAt)}`;
  qDateCell.font = infoValFont;
  worksheet.getRow(7).height = 20;

  // Row 8
  worksheet.mergeCells('A8:D8');
  const custNameCell = worksheet.getCell('A8');
  custNameCell.value = `Khách hàng: ${customerName}`;
  custNameCell.font = infoLabelFont;

  worksheet.mergeCells('E8:H8');
  const validCell = worksheet.getCell('E8');
  validCell.value = `Hiệu lực đến: ${formatDate(quotation.validUntil)}`;
  validCell.font = infoValFont;
  worksheet.getRow(8).height = 20;

  // Row 9
  worksheet.mergeCells('A9:D9');
  const compNameCell = worksheet.getCell('A9');
  compNameCell.value = `Công ty: ${customerCompanyName}`;
  compNameCell.font = infoValFont;

  worksheet.mergeCells('E9:H9');
  const codeCell = worksheet.getCell('E9');
  codeCell.value = `Mã khách hàng: ${customerCode}`;
  codeCell.font = infoValFont;
  worksheet.getRow(9).height = 20;

  // Row 10
  worksheet.mergeCells('A10:D10');
  const contactCell = worksheet.getCell('A10');
  contactCell.value = `Email: ${customerEmail}  |  SĐT: ${customerPhone}`;
  contactCell.font = infoValFont;

  worksheet.mergeCells('E10:H10');
  const addrCell = worksheet.getCell('E10');
  addrCell.value = `Địa chỉ: ${customerAddress}`;
  addrCell.font = infoValFont;
  worksheet.getRow(10).height = 20;

  // Row 11: Spacing
  worksheet.getRow(11).height = 12;

  // 5. Items Table Header (Row 12)
  const headerRow = worksheet.getRow(12);
  headerRow.height = 26;
  const headers = [
    'STT',
    'Mã SKU',
    'Tên sản phẩm',
    'Mô tả',
    'Đơn vị',
    'Số lượng',
    'Đơn giá (VNĐ)',
    'Thành tiền (VNĐ)',
  ];

  headers.forEach((hdr, idx) => {
    const colNum = idx + 1;
    const cell = headerRow.getCell(colNum);
    cell.value = hdr;
    cell.font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: primaryNavy },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = thinBorder;
  });

  // 6. Items Table Rows (Row 13+)
  let currentRowNum = 13;
  const items = quotation.items || [];

  items.forEach((item, index) => {
    const row = worksheet.getRow(currentRowNum);
    row.height = 24;

    const isEven = index % 2 === 1;
    const rowBg = isEven ? lightGray : 'FFFFFF';

    // A: STT
    const cellA = row.getCell(1);
    cellA.value = index + 1;
    cellA.alignment = { vertical: 'middle', horizontal: 'center' };

    // B: SKU
    const cellB = row.getCell(2);
    cellB.value = item.productSku || '-';
    cellB.alignment = { vertical: 'middle', horizontal: 'center' };
    cellB.font = { name: 'Arial', size: 9.5, bold: true };

    // C: Product Name
    const cellC = row.getCell(3);
    cellC.value = item.productName || '-';
    cellC.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    };

    // D: Description
    const cellD = row.getCell(4);
    cellD.value = item.description || '-';
    cellD.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    };

    // E: Unit
    const cellE = row.getCell(5);
    cellE.value = item.unit || '-';
    cellE.alignment = { vertical: 'middle', horizontal: 'center' };

    // F: Quantity
    const cellF = row.getCell(6);
    cellF.value = Number(item.quantity);
    cellF.numFmt = '#,##0.00';
    cellF.alignment = { vertical: 'middle', horizontal: 'right' };

    // G: Unit Price
    const cellG = row.getCell(7);
    cellG.value = Number(item.unitPrice);
    cellG.numFmt = '#,##0.00';
    cellG.alignment = { vertical: 'middle', horizontal: 'right' };

    // H: Line Total
    const cellH = row.getCell(8);
    cellH.value = Number(item.lineTotal);
    cellH.numFmt = '#,##0.00';
    cellH.alignment = { vertical: 'middle', horizontal: 'right' };
    cellH.font = { name: 'Arial', size: 9.5, bold: true };

    // Common styling
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      if (!cell.font) {
        cell.font = { name: 'Arial', size: 9.5, color: { argb: '1E293B' } };
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.border = thinBorder;
    }

    currentRowNum++;
  });

  // 7. Financial Summary (Subtotal, Discount, Tax, Total)
  // Subtotal
  worksheet.mergeCells(`A${currentRowNum}:G${currentRowNum}`);
  const subtotalLabel = worksheet.getCell(`A${currentRowNum}`);
  subtotalLabel.value = 'Cộng tiền hàng (Subtotal):';
  subtotalLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  subtotalLabel.font = { name: 'Arial', size: 10, bold: true };
  subtotalLabel.border = thinBorder;

  const subtotalVal = worksheet.getCell(`H${currentRowNum}`);
  subtotalVal.value = Number(quotation.subtotal);
  subtotalVal.numFmt = '#,##0.00';
  subtotalVal.alignment = { vertical: 'middle', horizontal: 'right' };
  subtotalVal.font = { name: 'Arial', size: 10, bold: true };
  subtotalVal.border = thinBorder;
  worksheet.getRow(currentRowNum).height = 22;
  currentRowNum++;

  // Discount
  worksheet.mergeCells(`A${currentRowNum}:G${currentRowNum}`);
  const discountLabel = worksheet.getCell(`A${currentRowNum}`);
  discountLabel.value = 'Chiết khấu (Discount):';
  discountLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  discountLabel.font = { name: 'Arial', size: 10 };
  discountLabel.border = thinBorder;

  const discountVal = worksheet.getCell(`H${currentRowNum}`);
  discountVal.value = Number(quotation.discountAmount);
  discountVal.numFmt = '#,##0.00';
  discountVal.alignment = { vertical: 'middle', horizontal: 'right' };
  discountVal.font = { name: 'Arial', size: 10 };
  discountVal.border = thinBorder;
  worksheet.getRow(currentRowNum).height = 20;
  currentRowNum++;

  // Tax
  worksheet.mergeCells(`A${currentRowNum}:G${currentRowNum}`);
  const taxLabel = worksheet.getCell(`A${currentRowNum}`);
  taxLabel.value = `Thuế GTGT (${quotation.taxRate}% VAT):`;
  taxLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  taxLabel.font = { name: 'Arial', size: 10 };
  taxLabel.border = thinBorder;

  const taxVal = worksheet.getCell(`H${currentRowNum}`);
  taxVal.value = Number(quotation.taxAmount);
  taxVal.numFmt = '#,##0.00';
  taxVal.alignment = { vertical: 'middle', horizontal: 'right' };
  taxVal.font = { name: 'Arial', size: 10 };
  taxVal.border = thinBorder;
  worksheet.getRow(currentRowNum).height = 20;
  currentRowNum++;

  // Total Amount
  worksheet.mergeCells(`A${currentRowNum}:G${currentRowNum}`);
  const totalLabel = worksheet.getCell(`A${currentRowNum}`);
  totalLabel.value = 'TỔNG CỘNG THANH TOÁN (Total):';
  totalLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  totalLabel.font = {
    name: 'Arial',
    size: 11,
    bold: true,
    color: { argb: primaryNavy },
  };
  totalLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: summaryHighlight },
  };
  totalLabel.border = {
    top: { style: 'thin', color: { argb: borderGray } },
    left: { style: 'thin', color: { argb: borderGray } },
    bottom: { style: 'double', color: { argb: primaryNavy } },
    right: { style: 'thin', color: { argb: borderGray } },
  };

  const totalVal = worksheet.getCell(`H${currentRowNum}`);
  totalVal.value = Number(quotation.totalAmount);
  totalVal.numFmt = '#,##0.00';
  totalVal.alignment = { vertical: 'middle', horizontal: 'right' };
  totalVal.font = {
    name: 'Arial',
    size: 11,
    bold: true,
    color: { argb: primaryNavy },
  };
  totalVal.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: summaryHighlight },
  };
  totalVal.border = {
    top: { style: 'thin', color: { argb: borderGray } },
    left: { style: 'thin', color: { argb: borderGray } },
    bottom: { style: 'double', color: { argb: primaryNavy } },
    right: { style: 'thin', color: { argb: borderGray } },
  };
  worksheet.getRow(currentRowNum).height = 26;
  currentRowNum++;

  // Row Spacing
  worksheet.getRow(currentRowNum).height = 12;
  currentRowNum++;

  // 8. Terms and Notes
  worksheet.mergeCells(`A${currentRowNum}:H${currentRowNum}`);
  const termsHeader = worksheet.getCell(`A${currentRowNum}`);
  termsHeader.value = 'ĐIỀU KHOẢN VÀ GHI CHÚ';
  termsHeader.font = {
    name: 'Arial',
    size: 10.5,
    bold: true,
    color: { argb: primaryNavy },
  };
  termsHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F1F5F9' },
  };
  termsHeader.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(currentRowNum).height = 22;
  currentRowNum++;

  worksheet.mergeCells(`A${currentRowNum}:H${currentRowNum}`);
  const deliveryCell = worksheet.getCell(`A${currentRowNum}`);
  deliveryCell.value = `• Địa chỉ giao hàng: ${quotation.deliveryAddress || '-'}`;
  deliveryCell.font = { name: 'Arial', size: 9.5, color: { argb: '334155' } };
  deliveryCell.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(currentRowNum).height = 20;
  currentRowNum++;

  worksheet.mergeCells(`A${currentRowNum}:H${currentRowNum}`);
  const paymentCell = worksheet.getCell(`A${currentRowNum}`);
  paymentCell.value = `• Điều khoản thanh toán: ${quotation.paymentTerms || '-'}`;
  paymentCell.font = { name: 'Arial', size: 9.5, color: { argb: '334155' } };
  paymentCell.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(currentRowNum).height = 20;
  currentRowNum++;

  worksheet.mergeCells(`A${currentRowNum}:H${currentRowNum}`);
  const notesCell = worksheet.getCell(`A${currentRowNum}`);
  notesCell.value = `• Ghi chú: ${quotation.notes || '-'}`;
  notesCell.font = { name: 'Arial', size: 9.5, color: { argb: '334155' } };
  notesCell.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(currentRowNum).height = 20;
  currentRowNum++;

  // Row Spacing before signature
  worksheet.getRow(currentRowNum).height = 16;
  currentRowNum++;

  // 9. Signature Block
  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  const custSigTitle = worksheet.getCell(`A${currentRowNum}`);
  custSigTitle.value = 'ĐẠI DIỆN KHÁCH HÀNG';
  custSigTitle.font = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: '0F172A' },
  };
  custSigTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells(`E${currentRowNum}:H${currentRowNum}`);
  const sellerSigTitle = worksheet.getCell(`E${currentRowNum}`);
  sellerSigTitle.value = 'ĐẠI DIỆN BÊN BÁN';
  sellerSigTitle.font = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: '0F172A' },
  };
  sellerSigTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(currentRowNum).height = 22;
  currentRowNum++;

  worksheet.mergeCells(`A${currentRowNum}:D${currentRowNum}`);
  const custSigSub = worksheet.getCell(`A${currentRowNum}`);
  custSigSub.value = '(Ký, ghi rõ họ tên)';
  custSigSub.font = {
    name: 'Arial',
    size: 9,
    italic: true,
    color: { argb: '64748B' },
  };
  custSigSub.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells(`E${currentRowNum}:H${currentRowNum}`);
  const sellerSigSub = worksheet.getCell(`E${currentRowNum}`);
  sellerSigSub.value = '(Ký, đóng dấu, ghi rõ họ tên)';
  sellerSigSub.font = {
    name: 'Arial',
    size: 9,
    italic: true,
    color: { argb: '64748B' },
  };
  sellerSigSub.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(currentRowNum).height = 18;
  currentRowNum += 4; // Space for physical signature

  // 10. Page Setup & Printing options
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.6,
      bottom: 0.6,
      header: 0.3,
      footer: 0.3,
    },
    printTitlesRow: '12:12', // Repeat product table header row if printed across multiple pages
  };

  // Freeze pane below metadata, above table header (row 12)
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 12 }];
}
