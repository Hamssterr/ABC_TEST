import { CustomerEntity } from '../customer.entity.js';

export class CustomerResponseDto {
  id!: string;
  code!: string;
  name!: string;
  companyName!: string | null;
  email!: string | null;
  phone!: string | null;
  address!: string | null;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(entity: CustomerEntity): CustomerResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      companyName: entity.companyName ?? null,
      email: entity.email ?? null,
      phone: entity.phone ?? null,
      address: entity.address ?? null,
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
