import { apiClient } from './api-client'
import type { ApiResponse } from '@/types/api'
import type { CreateQuotationDraftInput, QuotationDraft } from '@/types/ai'

/**
 * Sends a raw quotation request to the AI assistant to parse into a quotation draft.
 * Sets a 35s timeout to allow Gemini AI processing while adhering to server-side timeout limits.
 */
export async function createQuotationDraft(
  input: CreateQuotationDraftInput
): Promise<ApiResponse<QuotationDraft>> {
  const response = await apiClient.post<ApiResponse<QuotationDraft>>(
    '/ai/quotation-draft',
    input,
    { timeout: 35000 }
  )
  return response.data
}
