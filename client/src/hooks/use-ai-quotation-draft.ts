import { useMutation } from '@tanstack/react-query'
import { createQuotationDraft } from '@/api/ai-api'
import { isApiError } from '@/api/api-client'
import type { CreateQuotationDraftInput, QuotationDraft } from '@/types/ai'
import type { ApiResponse, NormalizedApiError } from '@/types/api'

export function getAiErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const apiError = error as NormalizedApiError

    switch (apiError.status) {
      case 400:
        if (apiError.validationErrors && apiError.validationErrors.length > 0) {
          return apiError.validationErrors.join(', ')
        }
        return 'Nội dung đầu vào không hợp lệ. Vui lòng kiểm tra lại văn bản yêu cầu (từ 1 đến 5000 ký tự).'
      case 404:
        return 'Không tìm thấy thông tin khách hàng trên hệ thống.'
      case 502:
        return 'AI trả về dữ liệu không hợp lệ. Bạn có thể thử lại hoặc tiếp tục nhập thủ công.'
      case 503:
        return 'Trợ lý AI hiện không khả dụng (chưa cấu hình API hoặc hết hạn ngạch). Bạn có thể tiếp tục nhập thủ công.'
      case 504:
      case 408:
        return 'Yêu cầu AI quá thời gian chờ (timeout). Vui lòng thử lại hoặc tiếp tục nhập thủ công.'
      default:
        if (apiError.kind === 'NETWORK_ERROR') {
          return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
        }
        return apiError.message || 'Không thể tạo bản nháp bằng AI. Vui lòng thử lại.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Không thể tạo bản nháp bằng AI. Vui lòng thử lại.'
}

export function useAiQuotationDraft() {
  return useMutation<ApiResponse<QuotationDraft>, unknown, CreateQuotationDraftInput>({
    mutationFn: (input: CreateQuotationDraftInput) => createQuotationDraft(input),
  })
}
