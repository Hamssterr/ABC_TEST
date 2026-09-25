import { PDFDocument, PDFPage, PDFFont, rgb, PageSizes } from 'pdf-lib';
import type { QuotationEntity } from '../../quotations/enitities/quotation.entity.js';
import type { QuotationCompanyInfo } from '../config/quotation-company.config.js';

export function formatCurrencyVND(amountStr: string | number): string {
  const num = typeof amountStr === 'string' ? parseFloat(amountStr) : amountStr;
  if (isNaN(num)) return '0 ₫';
  return (
    new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 2,
    }).format(num) + ' ₫'
  );
}

export function formatDateVN(
  dateInput: string | Date | null | undefined,
): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export async function renderQuotationV1(
  pdfDoc: PDFDocument,
  quotation: QuotationEntity,
  companyInfo: QuotationCompanyInfo,
  fontRegular: PDFFont,
  fontBold: PDFFont,
): Promise<void> {
  const [pageWidth, pageHeight] = PageSizes.A4; // 595.28 x 841.89
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 515.28

  const colWidths = {
    stt: 28,
    sku: 72,
    name: 180,
    unit: 40,
    qty: 45,
    price: 75,
    total: 75,
  };

  const colX = {
    stt: margin,
    sku: margin + colWidths.stt,
    name: margin + colWidths.stt + colWidths.sku,
    unit: margin + colWidths.stt + colWidths.sku + colWidths.name,
    qty:
      margin + colWidths.stt + colWidths.sku + colWidths.name + colWidths.unit,
    price:
      margin +
      colWidths.stt +
      colWidths.sku +
      colWidths.name +
      colWidths.unit +
      colWidths.qty,
    total:
      margin +
      colWidths.stt +
      colWidths.sku +
      colWidths.name +
      colWidths.unit +
      colWidths.qty +
      colWidths.price,
  };

  let currentPage: PDFPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      // Company name
      currentPage.drawText(companyInfo.name, {
        x: margin,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.3),
      });
      y -= 14;

      // Company details
      currentPage.drawText(`Địa chỉ: ${companyInfo.address}`, {
        x: margin,
        y,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 12;

      currentPage.drawText(
        `Điện thoại: ${companyInfo.phone}  |  Email: ${companyInfo.email}  |  MST: ${companyInfo.taxCode}`,
        {
          x: margin,
          y,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.3),
        },
      );
      y -= 15;

      // Divider line
      currentPage.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 25;

      // Title
      const title = 'BÁO GIÁ';
      const titleWidth = fontBold.widthOfTextAtSize(title, 18);
      currentPage.drawText(title, {
        x: (pageWidth - titleWidth) / 2,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0.12, 0.28, 0.55),
      });
      y -= 22;

      // Quotation meta
      const metaTextLeft = `Số báo giá: ${quotation.quotationNumber}`;
      const metaTextRight = `Ngày tạo: ${formatDateVN(quotation.createdAt)}   |   Hiệu lực đến: ${formatDateVN(quotation.validUntil)}`;
      currentPage.drawText(metaTextLeft, {
        x: margin,
        y,
        size: 9,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      const rightWidth = fontRegular.widthOfTextAtSize(metaTextRight, 9);
      currentPage.drawText(metaTextRight, {
        x: pageWidth - margin - rightWidth,
        y,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 18;

      // Customer info box
      const cust = (quotation.customerSnapshot || {}) as Record<string, any>;
      const custBoxHeight = 52;
      currentPage.drawRectangle({
        x: margin,
        y: y - custBoxHeight + 10,
        width: contentWidth,
        height: custBoxHeight,
        color: rgb(0.97, 0.98, 1.0),
        borderColor: rgb(0.85, 0.88, 0.95),
        borderWidth: 0.8,
      });

      const custY = y + 2;
      currentPage.drawText(`Khách hàng: ${cust.name || ''}`, {
        x: margin + 8,
        y: custY - 8,
        size: 9,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });

      if (cust.companyName) {
        currentPage.drawText(`Công ty: ${cust.companyName}`, {
          x: margin + 250,
          y: custY - 8,
          size: 9,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      const contactLine = `SĐT: ${cust.phone || '-'}   |   Email: ${cust.email || '-'}`;
      currentPage.drawText(contactLine, {
        x: margin + 8,
        y: custY - 22,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });

      const addrLine = `Địa chỉ: ${cust.address || '-'}`;
      currentPage.drawText(addrLine, {
        x: margin + 8,
        y: custY - 35,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });

      y -= custBoxHeight + 8;
    } else {
      // Repeat header on subsequent pages
      currentPage.drawText(
        `${companyInfo.name} - Báo giá ${quotation.quotationNumber}`,
        {
          x: margin,
          y,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.5, 0.5, 0.5),
        },
      );
      y -= 15;
    }

    // Table Header
    const thHeight = 22;
    currentPage.drawRectangle({
      x: margin,
      y: y - thHeight + 8,
      width: contentWidth,
      height: thHeight,
      color: rgb(0.15, 0.35, 0.65),
    });

    const thY = y - 4;
    const thColor = rgb(1, 1, 1);
    currentPage.drawText('STT', {
      x: colX.stt + 4,
      y: thY,
      size: 8,
      font: fontBold,
      color: thColor,
    });
    currentPage.drawText('Mã SP', {
      x: colX.sku + 4,
      y: thY,
      size: 8,
      font: fontBold,
      color: thColor,
    });
    currentPage.drawText('Tên sản phẩm', {
      x: colX.name + 4,
      y: thY,
      size: 8,
      font: fontBold,
      color: thColor,
    });
    currentPage.drawText('ĐVT', {
      x: colX.unit + 4,
      y: thY,
      size: 8,
      font: fontBold,
      color: thColor,
    });
    currentPage.drawText('SL', {
      x: colX.qty + 4,
      y: thY,
      size: 8,
      font: fontBold,
      color: thColor,
    });
    currentPage.drawText('Đơn giá', {
      x: colX.price + 4,
      y: thY,
      size: 8,
      font: fontBold,
      color: thColor,
    });
    currentPage.drawText('Thành tiền', {
      x: colX.total + 4,
      y: thY,
      size: 8,
      font: fontBold,
      color: thColor,
    });

    y -= thHeight;
  };

  // Draw first page header
  drawHeader(true);

  // Render Table Items
  const items = quotation.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nameLines = wrapText(
      item.productName,
      fontBold,
      8.5,
      colWidths.name - 8,
    );
    const descLines = item.description
      ? wrapText(item.description, fontRegular, 7.5, colWidths.name - 8)
      : [];

    const totalLines = nameLines.length + descLines.length;
    const rowHeight = Math.max(22, totalLines * 11 + 8);

    // Check if new page is needed
    if (y - rowHeight < 140) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeader(false);
    }

    // Row zebra background
    if (i % 2 === 1) {
      currentPage.drawRectangle({
        x: margin,
        y: y - rowHeight + 8,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.97, 0.98, 0.99),
      });
    }

    // Row border line bottom
    currentPage.drawLine({
      start: { x: margin, y: y - rowHeight + 8 },
      end: { x: pageWidth - margin, y: y - rowHeight + 8 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    const textY = y - 4;
    currentPage.drawText(String(i + 1), {
      x: colX.stt + 6,
      y: textY,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentPage.drawText(item.productSku || '', {
      x: colX.sku + 4,
      y: textY,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    let nameY = textY;
    for (const nLine of nameLines) {
      currentPage.drawText(nLine, {
        x: colX.name + 4,
        y: nameY,
        size: 8.5,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });
      nameY -= 11;
    }
    for (const dLine of descLines) {
      currentPage.drawText(dLine, {
        x: colX.name + 4,
        y: nameY,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.45, 0.45, 0.45),
      });
      nameY -= 10;
    }

    currentPage.drawText(item.unit || '', {
      x: colX.unit + 6,
      y: textY,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentPage.drawText(item.quantity || '', {
      x: colX.qty + 6,
      y: textY,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentPage.drawText(formatCurrencyVND(item.unitPrice), {
      x: colX.price + 4,
      y: textY,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentPage.drawText(formatCurrencyVND(item.lineTotal), {
      x: colX.total + 4,
      y: textY,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.3),
    });

    y -= rowHeight;
  }

  // Check if remaining space is enough for totals, terms, and signature (~180pt)
  if (y < 200) {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    drawHeader(false);
  }

  y -= 8;

  // Totals Section
  const totalsWidth = 230;
  const totalsX = pageWidth - margin - totalsWidth;
  const drawTotalLine = (label: string, value: string, isBold = false) => {
    currentPage.drawText(label, {
      x: totalsX,
      y,
      size: 9,
      font: isBold ? fontBold : fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    const valWidth = (isBold ? fontBold : fontRegular).widthOfTextAtSize(
      value,
      9,
    );
    currentPage.drawText(value, {
      x: pageWidth - margin - valWidth,
      y,
      size: 9,
      font: isBold ? fontBold : fontRegular,
      color: isBold ? rgb(0.12, 0.28, 0.55) : rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
  };

  drawTotalLine(
    'Cộng tiền hàng (Subtotal):',
    formatCurrencyVND(quotation.subtotal),
  );
  if (parseFloat(quotation.discountAmount || '0') > 0) {
    drawTotalLine(
      'Chiết khấu (Discount):',
      `-${formatCurrencyVND(quotation.discountAmount)}`,
    );
  }
  drawTotalLine(
    `Thuế GTGT (${quotation.taxRate || '10'}%):`,
    formatCurrencyVND(quotation.taxAmount),
  );

  currentPage.drawLine({
    start: { x: totalsX, y: y + 4 },
    end: { x: pageWidth - margin, y: y + 4 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  drawTotalLine(
    'TỔNG CỘNG THANH TOÁN:',
    formatCurrencyVND(quotation.totalAmount),
    true,
  );
  y -= 10;

  // Terms and Notes Section
  const termsBoxY = y;
  let termsTextY = termsBoxY;
  currentPage.drawText('ĐIỀU KHOẢN VÀ GHI CHÚ:', {
    x: margin,
    y: termsTextY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  termsTextY -= 12;

  if (quotation.deliveryAddress) {
    currentPage.drawText(`• Địa điểm giao hàng: ${quotation.deliveryAddress}`, {
      x: margin + 4,
      y: termsTextY,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    termsTextY -= 11;
  }
  if (quotation.paymentTerms) {
    currentPage.drawText(`• Điều khoản thanh toán: ${quotation.paymentTerms}`, {
      x: margin + 4,
      y: termsTextY,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    termsTextY -= 11;
  }
  if (quotation.notes) {
    currentPage.drawText(`• Ghi chú: ${quotation.notes}`, {
      x: margin + 4,
      y: termsTextY,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    termsTextY -= 11;
  }

  y = Math.min(y - 50, termsTextY - 15);

  // Signature Block
  const sigY = Math.max(y, 70);
  const leftSigX = margin + 40;
  const rightSigX = pageWidth - margin - 180;

  currentPage.drawText('ĐẠI DIỆN KHÁCH HÀNG', {
    x: leftSigX,
    y: sigY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  currentPage.drawText('(Ký, ghi rõ họ tên)', {
    x: leftSigX + 12,
    y: sigY - 11,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  currentPage.drawText('ĐẠI DIỆN BÊN BÁN', {
    x: rightSigX + 25,
    y: sigY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  currentPage.drawText('(Ký, ghi rõ họ tên, đóng dấu)', {
    x: rightSigX + 5,
    y: sigY - 11,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Footer: Page Numbering on all pages
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const footerText = `Trang ${i + 1} / ${totalPages}`;
    const fWidth = fontRegular.widthOfTextAtSize(footerText, 7.5);
    page.drawText(footerText, {
      x: (pageWidth - fWidth) / 2,
      y: 20,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}
