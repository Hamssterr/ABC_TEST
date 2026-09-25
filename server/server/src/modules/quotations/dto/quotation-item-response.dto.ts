import type { QuotationItemEntity } from '../enitities/quotation-item.entity.js';

export class QuotationItemResponseDto {
  id!: string;
  productId!: string;
  productSku!: string;
  productName!: string;
  description!: string | null;
  unit!: string;
  quantity!: string;
  unitPrice!: string;
  lineTotal!: string;

  static fromEntity(entity: QuotationItemEntity): QuotationItemResponseDto {
    const dto = new QuotationItemResponseDto();
    dto.id = entity.id;
    dto.productId = entity.productId;
    dto.productSku = entity.productSku;
    dto.productName = entity.productName;
    dto.description = entity.description;
    dto.unit = entity.unit;
    dto.quantity = entity.quantity;
    dto.unitPrice = entity.unitPrice;
    dto.lineTotal = entity.lineTotal;
    return dto;
  }
}
