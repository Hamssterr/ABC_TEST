import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Decimal } from 'decimal.js';
import { ProductEntity } from './product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductResponseDto } from './dto/product-response.dto.js';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import {
  buildPaginatedResponse,
  getPaginationSkipTake,
} from '../../common/pagination/pagination.util.js';
import {
  ApiResponse,
  ApiPaginatedResponse,
} from '../../common/interfaces/api-response.interface.js';
import { ProductCandidateDto } from '../ai/dto/product-candidate.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<ApiPaginatedResponse<ProductResponseDto>> {
    const { skip, take } = getPaginationSkipTake(query.page, query.limit);

    const [entities, total] = await this.productRepository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip,
      take,
    });

    const data = entities.map((entity) =>
      ProductResponseDto.fromEntity(entity),
    );
    const paginated = buildPaginatedResponse(
      data,
      total,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách sản phẩm thành công',
      data: paginated.data,
      meta: paginated.meta,
    };
  }

  async findById(id: string): Promise<ApiResponse<ProductResponseDto>> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return {
      message: 'Lấy thông tin sản phẩm thành công',
      data: ProductResponseDto.fromEntity(product),
    };
  }

  async create(
    dto: CreateProductDto,
  ): Promise<ApiResponse<ProductResponseDto>> {
    try {
      const normalizedUnitPrice = new Decimal(dto.unitPrice).toFixed(2);

      const product = this.productRepository.create({
        sku: dto.sku.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        unit: dto.unit.trim(),
        unitPrice: normalizedUnitPrice,
        isActive: dto.isActive ?? true,
      });

      const saved = await this.productRepository.save(product);
      return {
        message: 'Tạo sản phẩm thành công',
        data: ProductResponseDto.fromEntity(saved),
      };
    } catch (error: any) {
      if (error?.code === '23505' || error?.driverError?.code === '23505') {
        throw new ConflictException('Product SKU already exists');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
  ): Promise<ApiResponse<ProductResponseDto>> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (dto.sku !== undefined) {
      product.sku = dto.sku.trim().toUpperCase();
    }
    if (dto.name !== undefined) {
      product.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      product.description = dto.description?.trim() ?? null;
    }
    if (dto.unit !== undefined) {
      product.unit = dto.unit.trim();
    }
    if (dto.unitPrice !== undefined) {
      product.unitPrice = new Decimal(dto.unitPrice).toFixed(2);
    }
    if (dto.isActive !== undefined) {
      product.isActive = dto.isActive;
    }

    try {
      const updated = await this.productRepository.save(product);
      return {
        message: 'Cập nhật thông tin sản phẩm thành công',
        data: ProductResponseDto.fromEntity(updated),
      };
    } catch (error: any) {
      if (error?.code === '23505' || error?.driverError?.code === '23505') {
        throw new ConflictException('Product SKU already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    await this.productRepository.softDelete(id);
  }

  async findActiveCandidates(
    productQuery: string,
    limit = 5,
  ): Promise<ProductCandidateDto[]> {
    const trimmed = productQuery?.trim();
    if (!trimmed) {
      return [];
    }

    const exactTerm = trimmed.toLowerCase();
    const escapedTerm = trimmed.replace(/[%_\\]/g, '\\$&').toLowerCase();
    const containsPattern = `%${escapedTerm}%`;

    const qb = this.productRepository.createQueryBuilder('product');
    qb.where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.deletedAt IS NULL')
      .andWhere(
        '(LOWER(product.sku) = :exactTerm OR LOWER(product.name) = :exactTerm OR LOWER(product.name) LIKE :containsPattern OR LOWER(product.sku) LIKE :containsPattern)',
        { exactTerm, containsPattern },
      )
      .orderBy(
        `CASE
          WHEN LOWER(product.sku) = :exactTerm THEN 1
          WHEN LOWER(product.name) = :exactTerm THEN 2
          WHEN LOWER(product.name) LIKE :startsWithPattern THEN 3
          WHEN LOWER(product.name) LIKE :containsPattern THEN 4
          ELSE 5
        END`,
        'ASC',
      )
      .addOrderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .setParameter('startsWithPattern', `${escapedTerm}%`)
      .limit(limit);

    const entities = await qb.getMany();
    return entities.map((entity) => ProductCandidateDto.fromEntity(entity));
  }
}
