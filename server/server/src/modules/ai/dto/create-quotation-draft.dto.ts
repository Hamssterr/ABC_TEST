import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateQuotationDraftDto {
  @IsNotEmpty({ message: 'Customer ID is required' })
  @IsUUID('4', { message: 'Customer ID must be a valid UUID v4' })
  customerId!: string;

  @IsNotEmpty({ message: 'rawRequest is required' })
  @IsString({ message: 'rawRequest must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 5000, {
    message: 'rawRequest must be between 1 and 5000 characters',
  })
  rawRequest!: string;
}
