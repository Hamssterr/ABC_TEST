import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductResponseDto } from './dto/product-response.dto.js';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import {
  ApiResponse,
  ApiPaginatedResponse,
} from '../../common/interfaces/api-response.interface.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<ApiPaginatedResponse<ProductResponseDto>> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<ProductResponseDto>> {
    return this.productsService.findById(id);
  }

  @Post()
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<ApiResponse<ProductResponseDto>> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ApiResponse<ProductResponseDto>> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.productsService.remove(id);
  }
}
