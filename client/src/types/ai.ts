import type { Product } from './product'

export interface CreateQuotationDraftInput {
  customerId: string
  rawRequest: string
}

export interface ProductCandidate {
  id: string
  sku: string
  name: string
  description: string | null
  unit: string
  unitPrice: string
}

export interface QuotationDraftItem {
  productQuery: string
  quantity: string | null
  candidates: ProductCandidate[]
}

export interface QuotationDraft {
  items: QuotationDraftItem[]
  deliveryAddress: string | null
  paymentTerms: string | null
  validityDays: number | null
  notes: string | null
  unresolvedFields: string[]
}

/**
 * Universal product interface accepted by quotation forms and comboboxes.
 * Encompasses both full Products from catalog and ProductCandidates returned by AI.
 */
export type SelectableProduct =
  | Product
  | (ProductCandidate & { isActive?: boolean; createdAt?: string; updatedAt?: string })
