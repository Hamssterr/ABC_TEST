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
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { CustomerResponseDto } from './dto/customer-response.dto.js';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';
import {
  ApiResponse,
  ApiPaginatedResponse,
} from '../../common/interfaces/api-response.interface.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<ApiPaginatedResponse<CustomerResponseDto>> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<CustomerResponseDto>> {
    return this.customersService.findById(id);
  }

  @Post()
  async create(
    @Body() dto: CreateCustomerDto,
  ): Promise<ApiResponse<CustomerResponseDto>> {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<ApiResponse<CustomerResponseDto>> {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.customersService.remove(id);
  }
}
