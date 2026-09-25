import { ProductEntity } from '../product.entity.js';

export class ProductResponseDto {
  id!: string;
  sku!: string;
  name!: string;
  description!: string | null;
  unit!: string;
  unitPrice!: string;
  isActive!: boolean;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(entity: ProductEntity): ProductResponseDto {
    return {
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      description: entity.description ?? null,
      unit: entity.unit,
      unitPrice: entity.unitPrice,
      isActive: entity.isActive,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt),
      updatedAt:
        entity.updatedAt instanceof Date
          ? entity.updatedAt.toISOString()
          : String(entity.updatedAt),
    };
  }
}
