import { apiClient } from './api-client'
import type { Product, CreateProductInput, UpdateProductInput } from '@/types/product'
import type { ApiResponse, ApiPaginatedResponse } from '@/types/api'
import type { PaginationParams } from '@/types/common'

export async function getProducts(
  params?: PaginationParams
): Promise<ApiPaginatedResponse<Product>> {
  const response = await apiClient.get<ApiPaginatedResponse<Product>>('/products', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    },
  })
  return response.data
}

export async function getProduct(id: string): Promise<ApiResponse<Product>> {
  const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`)
  return response.data
}

export async function createProduct(
  input: CreateProductInput
): Promise<ApiResponse<Product>> {
  const response = await apiClient.post<ApiResponse<Product>>('/products', input)
  return response.data
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ApiResponse<Product>> {
  const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, input)
  return response.data
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}
