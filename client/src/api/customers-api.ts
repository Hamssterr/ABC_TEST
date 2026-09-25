import { apiClient } from "./api-client";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/types/customer";
import type { ApiResponse, ApiPaginatedResponse } from "@/types/api";
import type { PaginationParams } from "@/types/common";

export async function getCustomers(
  params?: PaginationParams,
): Promise<ApiPaginatedResponse<Customer>> {
  const response = await apiClient.get<ApiPaginatedResponse<Customer>>(
    "/customers",
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
      },
    },
  );
  return response.data;
}

export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  const response = await apiClient.get<ApiResponse<Customer>>(
    `/customers/${id}`,
  );
  return response.data;
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<ApiResponse<Customer>> {
  const response = await apiClient.post<ApiResponse<Customer>>(
    "/customers",
    input,
  );
  return response.data;
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<ApiResponse<Customer>> {
  const response = await apiClient.patch<ApiResponse<Customer>>(
    `/customers/${id}`,
    input,
  );
  return response.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}
