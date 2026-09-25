import type { ProcessingJobStatus } from './processing-job'

export type QuotationStatus = 'SUBMITTED' | 'COMPLETED' | 'FAILED'

export interface CustomerSnapshot {
  id: string
  code: string
  name: string
  companyName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface QuotationItem {
  id: string
  productId: string
  productSku: string
  productName: string
  description: string | null
  unit: string
  quantity: string
  unitPrice: string
  lineTotal: string
}

export interface QuotationProcessingJobSummary {
  id: string
  status: ProcessingJobStatus
  attemptCount: number
  errorMessage: string | null
  fileName: string | null
  completedAt: string | null
}

export interface Quotation {
  id: string
  quotationNumber: string
  customerId: string
  customerSnapshot: CustomerSnapshot
  status: QuotationStatus
  subtotal: string
  discountAmount: string
  taxRate: string
  taxAmount: string
  totalAmount: string
  validUntil: string
  deliveryAddress: string | null
  paymentTerms: string | null
  notes: string | null
  templateVersion: string
  items: QuotationItem[]
  processingJob: QuotationProcessingJobSummary | null
  createdAt: string
  updatedAt: string
}

export interface QuotationListItem {
  quotationId: string
  quotationNumber: string
  status: QuotationStatus
  subtotal: string
  totalAmount: string
  validUntil: string
  jobStatus: ProcessingJobStatus | null
  createdAt: string
}

export interface CreateQuotationItemInput {
  productId: string
  quantity: string
}

export interface CreateQuotationInput {
  items: CreateQuotationItemInput[]
  discountAmount?: string
  taxRate?: string
  validUntil: string
  deliveryAddress?: string
  paymentTerms?: string
  notes?: string
}

export interface CreateQuotationResponse {
  quotationId: string
  quotationNumber: string
  jobId: string
  status: ProcessingJobStatus
}

export interface QuotationDownloadResponse {
  fileName: string
  downloadUrl: string
  expiresIn: number
}
