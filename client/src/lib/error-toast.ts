import { toast } from 'sonner'
import { isApiError } from '@/api/api-client'
import type { NormalizedApiError } from '@/types/api'

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'
): string {
  if (isApiError(error)) {
    const apiError = error as NormalizedApiError
    if (apiError.status === 409) {
      const msg = (apiError.message || '').toLowerCase()
      if (msg.includes('customer code') || msg.includes('khách hàng')) {
        return 'Mã khách hàng đã tồn tại trên hệ thống'
      }
      if (msg.includes('sku') || msg.includes('sản phẩm')) {
        return 'Mã SKU sản phẩm đã tồn tại trên hệ thống'
      }
      return 'Dữ liệu bị trùng lặp trên hệ thống'
    }
    if (apiError.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu'
    }
    if (apiError.validationErrors && apiError.validationErrors.length > 0) {
      return apiError.validationErrors.join(', ')
    }
    return apiError.message || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function showApiErrorToast(
  error: unknown,
  fallbackOrOptions?: string | { fallbackMessage?: string }
): void {
  const fallback =
    typeof fallbackOrOptions === 'string'
      ? fallbackOrOptions
      : fallbackOrOptions?.fallbackMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
  toast.error(getApiErrorMessage(error, fallback))
}

export const showErrorToast = showApiErrorToast
