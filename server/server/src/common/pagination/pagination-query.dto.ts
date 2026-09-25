import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must not be less than 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must not be less than 1' })
  @Max(100, { message: 'limit must not be greater than 100' })
  limit: number = 10;
}
