import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class CreateQuotationItemDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsUUID('4', { message: 'Product ID must be a valid UUID v4' })
  productId!: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsString({ message: 'Quantity must be a string' })
  @Matches(/^(?!0(\.0+)?$)\d+(\.\d{1,2})?$/, {
    message:
      'Quantity must be a positive decimal with at most 2 decimal places and greater than 0',
  })
  quantity!: string;
}
