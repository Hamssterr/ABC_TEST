export type QuotationJobStatus =
  | 'SUBMITTED'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'

export interface PaginationParams {
  page?: number
  limit?: number
}
