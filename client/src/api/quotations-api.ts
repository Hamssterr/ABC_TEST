import { apiClient } from './api-client'
import type { ApiResponse, ApiPaginatedResponse } from '@/types/api'
import type { PaginationParams } from '@/types/common'
import type {
  Quotation,
  QuotationListItem,
  CreateQuotationInput,
  CreateQuotationResponse,
  QuotationDownloadResponse,
} from '@/types/quotation'

export async function getCustomerQuotations(
  customerId: string,
  params?: PaginationParams
): Promise<ApiPaginatedResponse<QuotationListItem>> {
  const response = await apiClient.get<ApiPaginatedResponse<QuotationListItem>>(
    `/customers/${customerId}/quotations`,
    { params }
  )
  return response.data
}

export async function createQuotation(
  customerId: string,
  input: CreateQuotationInput
): Promise<ApiResponse<CreateQuotationResponse>> {
  const response = await apiClient.post<ApiResponse<CreateQuotationResponse>>(
    `/customers/${customerId}/quotations`,
    input
  )
  return response.data
}

export async function getQuotation(
  quotationId: string
): Promise<ApiResponse<Quotation>> {
  const response = await apiClient.get<ApiResponse<Quotation>>(
    `/quotations/${quotationId}`
  )
  return response.data
}

export async function getQuotationDownload(
  quotationId: string
): Promise<ApiResponse<QuotationDownloadResponse>> {
  const response = await apiClient.get<ApiResponse<QuotationDownloadResponse>>(
    `/quotations/${quotationId}/download`
  )
  return response.data
}

export async function exportQuotationExcel(
  quotationId: string
): Promise<{ blob: Blob; fileName: string }> {
  const response = await apiClient.get<Blob>(
    `/quotations/${quotationId}/export.xlsx`,
    { responseType: 'blob' }
  )

  let fileName = `quotation-${quotationId}.xlsx`
  const disposition = response.headers['content-disposition'] as string | undefined

  if (disposition) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i)
    if (filenameMatch && filenameMatch[1]) {
      fileName = filenameMatch[1].replace(/['"]/g, '').trim()
    }
  }

  return {
    blob: response.data,
    fileName,
  }
}
