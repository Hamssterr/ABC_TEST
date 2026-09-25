import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'SKU is required' })
  @IsString({ message: 'SKU must be a string' })
  @MaxLength(50, { message: 'SKU must not exceed 50 characters' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  sku!: string;

  @IsNotEmpty({ message: 'Product name is required' })
  @IsString({ message: 'Product name must be a string' })
  @MaxLength(255, { message: 'Product name must not exceed 255 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsNotEmpty({ message: 'Unit is required' })
  @IsString({ message: 'Unit must be a string' })
  @MaxLength(50, { message: 'Unit must not exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  unit!: string;

  @IsNotEmpty({ message: 'unitPrice is required' })
  @IsString({ message: 'unitPrice must be a decimal string' })
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'unitPrice must be a non-negative decimal string with at most 2 decimal places',
  })
  unitPrice!: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
