import { describe, it, expect } from 'vitest'
import {
  aiDraftInputSchema,
  convertValidityDaysToDate,
  resolveCandidateProductId,
  isDraftItemResolved,
} from '@/schemas/ai-quotation-schema'
import { getAiErrorMessage } from '@/hooks/use-ai-quotation-draft'
import type { QuotationDraftItem, ProductCandidate } from '@/types/ai'
import type { NormalizedApiError } from '@/types/api'

describe('AI Quotation Draft Schema & Helpers', () => {
  describe('aiDraftInputSchema', () => {
    it('accepts valid raw request text and trims whitespace', () => {
      const result = aiDraftInputSchema.parse({
        rawRequest: '   Cần báo giá 2 máy Laptop Dell   ',
      })
      expect(result.rawRequest).toBe('Cần báo giá 2 máy Laptop Dell')
    })

    it('rejects empty or whitespace-only raw request', () => {
      expect(() =>
        aiDraftInputSchema.parse({ rawRequest: '   ' })
      ).toThrow()
    })

    it('rejects raw request exceeding 5000 characters', () => {
      const longText = 'a'.repeat(5001)
      expect(() =>
        aiDraftInputSchema.parse({ rawRequest: longText })
      ).toThrow()
    })
  })

  describe('convertValidityDaysToDate', () => {
    const fixedBaseDate = new Date('2026-09-25T00:00:00Z')

    it('converts positive validityDays to YYYY-MM-DD string', () => {
      const result = convertValidityDaysToDate(15, fixedBaseDate)
      expect(result).toBe('2026-10-10')
    })

    it('handles month and year rollover correctly', () => {
      const result = convertValidityDaysToDate(100, fixedBaseDate)
      expect(result).toBe('2027-01-03')
    })

    it('returns null for null, undefined, 0, or negative validityDays', () => {
      expect(convertValidityDaysToDate(null, fixedBaseDate)).toBeNull()
      expect(convertValidityDaysToDate(undefined, fixedBaseDate)).toBeNull()
      expect(convertValidityDaysToDate(0, fixedBaseDate)).toBeNull()
      expect(convertValidityDaysToDate(-5, fixedBaseDate)).toBeNull()
      expect(convertValidityDaysToDate(NaN, fixedBaseDate)).toBeNull()
    })
  })

  describe('Candidate resolution logic', () => {
    const candidateA: ProductCandidate = {
      id: 'cand-1',
      sku: 'PRD-001',
      name: 'Laptop Dell XPS 15',
      description: null,
      unit: 'chiếc',
      unitPrice: '32000000.00',
    }

    const candidateB: ProductCandidate = {
      id: 'cand-2',
      sku: 'PRD-002',
      name: 'Laptop Dell Inspiron 14',
      description: null,
      unit: 'chiếc',
      unitPrice: '18500000.00',
    }

    it('auto-selects when exactly one candidate exists', () => {
      const item: QuotationDraftItem = {
        productQuery: 'Laptop XPS',
        quantity: '2',
        candidates: [candidateA],
      }

      const selectedId = resolveCandidateProductId(item, 0, {})
      expect(selectedId).toBe('cand-1')
    })

    it('prefers user selection when multiple candidates exist', () => {
      const item: QuotationDraftItem = {
        productQuery: 'Laptop Dell',
        quantity: '2',
        candidates: [candidateA, candidateB],
      }

      // No user selection yet
      expect(resolveCandidateProductId(item, 0, {})).toBe('')

      // User selects candidate B
      expect(
        resolveCandidateProductId(item, 0, { 0: 'cand-2' })
      ).toBe('cand-2')
    })

    it('returns empty string when no candidate exists', () => {
      const item: QuotationDraftItem = {
        productQuery: 'Thiết bị không tồn tại',
        quantity: '1',
        candidates: [],
      }

      expect(resolveCandidateProductId(item, 0, {})).toBe('')
    })
  })

  describe('isDraftItemResolved helper', () => {
    const candidate: ProductCandidate = {
      id: 'cand-1',
      sku: 'PRD-001',
      name: 'Laptop Dell XPS',
      description: null,
      unit: 'chiếc',
      unitPrice: '32000000.00',
    }

    it('returns false when quantity is null, empty, or non-positive', () => {
      const itemWithNullQty: QuotationDraftItem = {
        productQuery: 'Laptop',
        quantity: null,
        candidates: [candidate],
      }
      expect(isDraftItemResolved(itemWithNullQty, 0, {})).toBe(false)

      const itemWithZeroQty: QuotationDraftItem = {
        productQuery: 'Laptop',
        quantity: '0',
        candidates: [candidate],
      }
      expect(isDraftItemResolved(itemWithZeroQty, 0, {})).toBe(false)
    })

    it('returns false when multiple candidates exist and user has not chosen', () => {
      const itemWithMultiple: QuotationDraftItem = {
        productQuery: 'Laptop',
        quantity: '2',
        candidates: [candidate, { ...candidate, id: 'cand-2' }],
      }
      expect(isDraftItemResolved(itemWithMultiple, 0, {})).toBe(false)
      expect(isDraftItemResolved(itemWithMultiple, 0, { 0: 'cand-2' })).toBe(true)
    })

    it('returns true when quantity is valid and single candidate', () => {
      const validItem: QuotationDraftItem = {
        productQuery: 'Laptop',
        quantity: '2',
        candidates: [candidate],
      }
      expect(isDraftItemResolved(validItem, 0, {})).toBe(true)
    })
  })

  describe('getAiErrorMessage', () => {
    it('maps HTTP 400 to input validation message', () => {
      const error: NormalizedApiError = {
        status: 400,
        message: 'rawRequest must be between 1 and 5000 characters',
        kind: 'HTTP_ERROR',
      }
      expect(getAiErrorMessage(error)).toContain('Nội dung đầu vào không hợp lệ')
    })

    it('maps HTTP 404 to customer not found message', () => {
      const error: NormalizedApiError = {
        status: 404,
        message: 'Not Found',
        kind: 'HTTP_ERROR',
      }
      expect(getAiErrorMessage(error)).toContain('Không tìm thấy thông tin khách hàng')
    })

    it('maps HTTP 502 to AI invalid output message', () => {
      const error: NormalizedApiError = {
        status: 502,
        message: 'Bad Gateway',
        kind: 'HTTP_ERROR',
      }
      expect(getAiErrorMessage(error)).toContain('AI trả về dữ liệu không hợp lệ')
    })

    it('maps HTTP 503 to AI service unavailable message', () => {
      const error: NormalizedApiError = {
        status: 503,
        message: 'Service Unavailable',
        kind: 'HTTP_ERROR',
      }
      expect(getAiErrorMessage(error)).toContain('Trợ lý AI hiện không khả dụng')
    })

    it('maps HTTP 504 and 408 to timeout message', () => {
      const error504: NormalizedApiError = {
        status: 504,
        message: 'Gateway Timeout',
        kind: 'HTTP_ERROR',
      }
      expect(getAiErrorMessage(error504)).toContain('quá thời gian chờ (timeout)')

      const error408: NormalizedApiError = {
        status: 408,
        message: 'Timeout',
        kind: 'TIMEOUT',
      }
      expect(getAiErrorMessage(error408)).toContain('quá thời gian chờ (timeout)')
    })
  })
})
