import type { ProductEntity } from '../../products/product.entity.js';

export class ProductCandidateDto {
  id!: string;
  sku!: string;
  name!: string;
  description!: string | null;
  unit!: string;
  unitPrice!: string;

  static fromEntity(entity: ProductEntity): ProductCandidateDto {
    const dto = new ProductCandidateDto();
    dto.id = entity.id;
    dto.sku = entity.sku;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.unit = entity.unit;
    dto.unitPrice = entity.unitPrice;
    return dto;
  }
}
