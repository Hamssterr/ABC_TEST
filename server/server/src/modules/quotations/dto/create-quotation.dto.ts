import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  IsString,
  Matches,
  IsNotEmpty,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuotationItemDto } from './create-quotation-item.dto.js';

export function IsUniqueProductIds(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueProductIds',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (!Array.isArray(value)) return true;
          const ids = value.map((item) => item?.productId).filter(Boolean);
          return new Set(ids).size === ids.length;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Quotation items cannot contain duplicate product IDs';
        },
      },
    });
  };
}

export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotPastDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return true;
          const today = new Date().toISOString().slice(0, 10);
          return value >= today;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'validUntil cannot be earlier than today';
        },
      },
    });
  };
}

export class CreateQuotationDto {
  @IsArray({ message: 'Items must be an array' })
  @ArrayMinSize(1, { message: 'Quotation must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  @IsUniqueProductIds()
  items!: CreateQuotationItemDto[];

  @IsOptional()
  @IsString({ message: 'discountAmount must be a string' })
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'discountAmount must be a non-negative decimal with at most 2 decimal places',
  })
  discountAmount?: string;

  @IsOptional()
  @IsString({ message: 'taxRate must be a string' })
  @Matches(/^(100(\.00?)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/, {
    message:
      'taxRate must be a decimal between 0 and 100 with at most 2 decimal places',
  })
  taxRate?: string;

  @IsNotEmpty({ message: 'validUntil is required' })
  @IsString({ message: 'validUntil must be a string' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'validUntil must be in YYYY-MM-DD format',
  })
  @IsNotPastDate()
  validUntil!: string;

  @IsOptional()
  @IsString({ message: 'deliveryAddress must be a string' })
  deliveryAddress?: string;

  @IsOptional()
  @IsString({ message: 'paymentTerms must be a string' })
  paymentTerms?: string;

  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;
}
