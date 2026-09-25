import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import { env } from '@/config/env'
import type { ApiErrorResponse, NormalizedApiError } from '@/types/api'

export function isApiError(error: unknown): error is NormalizedApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'message' in error &&
    'status' in error
  )
}

export function normalizeError(error: unknown): NormalizedApiError {
  if (isApiError(error)) {
    return error
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse | string>

    // 1. Request cancelled
    if (axios.isCancel(error)) {
      return {
        status: 0,
        message: 'Yêu cầu đã bị hủy',
        kind: 'CANCELLED',
        originalError: error,
      }
    }

    // 2. Request timeout
    if (
      axiosError.code === 'ECONNABORTED' ||
      (axiosError.message && axiosError.message.toLowerCase().includes('timeout'))
    ) {
      return {
        status: 408,
        message: 'Kết nối mạng quá thời gian chờ (timeout). Vui lòng thử lại.',
        code: axiosError.code,
        kind: 'TIMEOUT',
        originalError: error,
      }
    }

    // 3. Network error / No response received from server
    if (!axiosError.response) {
      return {
        status: 0,
        message:
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc dịch vụ backend.',
        code: axiosError.code || 'ERR_NETWORK',
        kind: 'NETWORK_ERROR',
        originalError: error,
      }
    }

    // 4. HTTP response error from backend
    const { status, data } = axiosError.response
    let message = 'Đã có lỗi xảy ra từ máy chủ'
    let validationErrors: string[] | undefined
    let code: string | undefined

    if (data && typeof data === 'object') {
      const errResponse = data as ApiErrorResponse
      if (Array.isArray(errResponse.message)) {
        validationErrors = errResponse.message
        message = errResponse.message.join(', ')
      } else if (typeof errResponse.message === 'string') {
        message = errResponse.message
      }

      if (typeof errResponse.error === 'string') {
        code = errResponse.error
      }
    } else if (typeof data === 'string' && data.length > 0) {
      message = data
    }

    return {
      status,
      message,
      code,
      validationErrors,
      kind: 'HTTP_ERROR',
      originalError: error,
    }
  }

  // 5. Unknown error
  const fallbackMessage =
    error instanceof Error ? error.message : 'Lỗi không xác định'
  return {
    status: 500,
    message: fallbackMessage,
    kind: 'UNKNOWN',
    originalError: error,
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (error: unknown) => {
    return Promise.reject(normalizeError(error))
  }
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: unknown) => {
    return Promise.reject(normalizeError(error))
  }
)
