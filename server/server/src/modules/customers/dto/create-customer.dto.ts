import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'Customer code is required' })
  @IsString({ message: 'Customer code must be a string' })
  @MaxLength(50, { message: 'Customer code must not exceed 50 characters' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code!: string;

  @IsNotEmpty({ message: 'Customer name is required' })
  @IsString({ message: 'Customer name must be a string' })
  @MaxLength(255, { message: 'Customer name must not exceed 255 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  companyName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(50, { message: 'Phone must not exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address?: string;
}
