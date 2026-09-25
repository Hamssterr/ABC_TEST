import {
  Injectable,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';
import type { ProductEntity } from '../../products/product.entity.js';
import type {
  QuotationCalculationItem,
  QuotationCalculationResult,
} from '../types/quotation-calculation.type.js';

export interface CalculatorInputItem {
  product: ProductEntity;
  quantity: string;
}

@Injectable()
export class QuotationCalculatorService {
  calculate(
    items: CalculatorInputItem[],
    discountAmountStr = '0.00',
    taxRateStr = '10.00',
  ): QuotationCalculationResult {
    if (!items || items.length === 0) {
      throw new BadRequestException('Quotation must contain at least one item');
    }

    const calculatedItems: QuotationCalculationItem[] = [];
    let subtotalDec = new Decimal(0);

    for (const item of items) {
      const quantityDec = new Decimal(item.quantity);
      if (quantityDec.lessThanOrEqualTo(0)) {
        throw new BadRequestException(
          `Quantity must be greater than 0 for product ${item.product.sku}`,
        );
      }

      const unitPriceDec = new Decimal(item.product.unitPrice);
      const lineTotalDec = quantityDec
        .times(unitPriceDec)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      subtotalDec = subtotalDec.plus(lineTotalDec);

      calculatedItems.push({
        productId: item.product.id,
        productSku: item.product.sku,
        productName: item.product.name,
        description: item.product.description,
        unit: item.product.unit,
        quantity: quantityDec.toFixed(2),
        unitPrice: unitPriceDec.toFixed(2),
        lineTotal: lineTotalDec.toFixed(2),
      });
    }

    const discountDec = new Decimal(discountAmountStr || '0.00');
    if (discountDec.lessThan(0)) {
      throw new BadRequestException('Discount amount cannot be negative');
    }

    if (discountDec.greaterThan(subtotalDec)) {
      throw new UnprocessableEntityException(
        'Discount amount cannot exceed subtotal',
      );
    }

    const taxRateDec = new Decimal(taxRateStr || '0.00');
    if (taxRateDec.lessThan(0) || taxRateDec.greaterThan(100)) {
      throw new BadRequestException('Tax rate must be between 0 and 100');
    }

    const taxableAmountDec = subtotalDec.minus(discountDec);
    const taxAmountDec = taxableAmountDec
      .times(taxRateDec)
      .dividedBy(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalAmountDec = taxableAmountDec
      .plus(taxAmountDec)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      items: calculatedItems,
      subtotal: subtotalDec.toFixed(2),
      discountAmount: discountDec.toFixed(2),
      taxRate: taxRateDec.toFixed(2),
      taxAmount: taxAmountDec.toFixed(2),
      totalAmount: totalAmountDec.toFixed(2),
    };
  }
}
