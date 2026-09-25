import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CustomerEntity } from './customer.entity.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { CustomerResponseDto } from './dto/customer-response.dto.js';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import {
  buildPaginatedResponse,
  getPaginationSkipTake,
} from '../../common/pagination/pagination.util.js';
import {
  ApiResponse,
  ApiPaginatedResponse,
} from '../../common/interfaces/api-response.interface.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<ApiPaginatedResponse<CustomerResponseDto>> {
    const { skip, take } = getPaginationSkipTake(query.page, query.limit);

    const [entities, total] = await this.customerRepository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip,
      take,
    });

    const data = entities.map((entity) =>
      CustomerResponseDto.fromEntity(entity),
    );
    const paginated = buildPaginatedResponse(
      data,
      total,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách khách hàng thành công',
      data: paginated.data,
      meta: paginated.meta,
    };
  }

  async findById(id: string): Promise<ApiResponse<CustomerResponseDto>> {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return {
      message: 'Lấy thông tin khách hàng thành công',
      data: CustomerResponseDto.fromEntity(customer),
    };
  }

  async create(
    dto: CreateCustomerDto,
  ): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      const customer = this.customerRepository.create({
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        companyName: dto.companyName?.trim() ?? null,
        email: dto.email?.trim() ?? null,
        phone: dto.phone?.trim() ?? null,
        address: dto.address?.trim() ?? null,
      });

      const saved = await this.customerRepository.save(customer);
      return {
        message: 'Tạo khách hàng thành công',
        data: CustomerResponseDto.fromEntity(saved),
      };
    } catch (error: any) {
      if (error?.code === '23505' || error?.driverError?.code === '23505') {
        throw new ConflictException('Customer code already exists');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<ApiResponse<CustomerResponseDto>> {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    if (dto.code !== undefined) {
      customer.code = dto.code.trim().toUpperCase();
    }
    if (dto.name !== undefined) {
      customer.name = dto.name.trim();
    }
    if (dto.companyName !== undefined) {
      customer.companyName = dto.companyName?.trim() ?? null;
    }
    if (dto.email !== undefined) {
      customer.email = dto.email?.trim() ?? null;
    }
    if (dto.phone !== undefined) {
      customer.phone = dto.phone?.trim() ?? null;
    }
    if (dto.address !== undefined) {
      customer.address = dto.address?.trim() ?? null;
    }

    try {
      const updated = await this.customerRepository.save(customer);
      return {
        message: 'Cập nhật thông tin khách hàng thành công',
        data: CustomerResponseDto.fromEntity(updated),
      };
    } catch (error: any) {
      if (error?.code === '23505' || error?.driverError?.code === '23505') {
        throw new ConflictException('Customer code already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    await this.customerRepository.softDelete(id);
  }
}
