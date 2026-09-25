export interface ApiResponse<T = unknown> {
  message: string
  data: T
}

export interface ApiPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiPaginatedResponse<T = unknown> {
  message: string
  data: T[]
  meta: ApiPaginationMeta
}

export interface ApiErrorResponse {
  statusCode: number
  message: string[] | string
  error: string
  path?: string
  timestamp?: string
}

export type ApiErrorKind =
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'UNKNOWN'

export interface NormalizedApiError {
  status: number
  message: string
  code?: string
  validationErrors?: string[]
  kind: ApiErrorKind
  originalError?: unknown
}
