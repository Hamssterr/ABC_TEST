import { describe, it, expect } from 'vitest'
import {
  quotationFormSchema,
  calculateQuotationPreview,
  toCreateQuotationPayload,
} from '@/schemas/quotation-schema'

describe('quotation-schema', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const validUuid1 = 'c028ea71-6386-4f76-80db-f9521191ebc5'
  const validUuid2 = 'd138fa82-7497-4a87-91ec-0a6322a2fcd6'

  describe('quotationFormSchema validation', () => {
    it('validates a correct quotation form input', () => {
      const validData = {
        items: [
          { productId: validUuid1, quantity: '2.5' },
          { productId: validUuid2, quantity: '10' },
        ],
        discountAmount: '50000.00',
        taxRate: '10.00',
        validUntil: tomorrow,
        deliveryAddress: '123 Đường Lê Lợi, Q.1, TP.HCM',
        paymentTerms: '30 ngày',
        notes: 'Giao hàng giờ hành chính',
      }

      const result = quotationFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejects duplicate productIds across items', () => {
      const duplicateData = {
        items: [
          { productId: validUuid1, quantity: '1' },
          { productId: validUuid1, quantity: '2' },
        ],
        discountAmount: '0.00',
        taxRate: '10.00',
        validUntil: tomorrow,
      }

      const result = quotationFormSchema.safeParse(duplicateData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path.includes('items'))
        expect(error?.message).toContain('Không được chọn trùng sản phẩm')
      }
    })

    it('rejects invalid or non-positive quantity', () => {
      const zeroQty = {
        items: [{ productId: validUuid1, quantity: '0' }],
        validUntil: tomorrow,
      }
      expect(quotationFormSchema.safeParse(zeroQty).success).toBe(false)

      const negativeQty = {
        items: [{ productId: validUuid1, quantity: '-1' }],
        validUntil: tomorrow,
      }
      expect(quotationFormSchema.safeParse(negativeQty).success).toBe(false)

      const threeDecimals = {
        items: [{ productId: validUuid1, quantity: '1.234' }],
        validUntil: tomorrow,
      }
      expect(quotationFormSchema.safeParse(threeDecimals).success).toBe(false)
    })

    it('rejects validUntil dates in the past', () => {
      const pastData = {
        items: [{ productId: validUuid1, quantity: '1' }],
        discountAmount: '0.00',
        taxRate: '10.00',
        validUntil: '2020-01-01',
      }
      const result = quotationFormSchema.safeParse(pastData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('validUntil'))
        expect(issue?.message).toContain('quá khứ')
      }
    })
  })

  describe('calculateQuotationPreview', () => {
    it('calculates line totals, subtotal, discount, tax, and total matching backend Decimal.js logic', () => {
      const items = [
        { productId: 'p1', quantity: '2.5', unitPrice: '1000000.00' }, // 2,500,000.00
        { productId: 'p2', quantity: '3', unitPrice: '500000.00' },    // 1,500,000.00
      ]

      // subtotal = 4,000,000.00
      // discount = 200,000.00
      // taxable = 3,800,000.00
      // tax (10%) = 380,000.00
      // total = 4,180,000.00
      const preview = calculateQuotationPreview(items, '200000.00', '10.00')

      expect(preview.lineTotals['p1']).toBe('2500000.00')
      expect(preview.lineTotals['p2']).toBe('1500000.00')
      expect(preview.subtotal).toBe('4000000.00')
      expect(preview.discountAmount).toBe('200000.00')
      expect(preview.taxRate).toBe('10.00')
      expect(preview.taxAmount).toBe('380000.00')
      expect(preview.totalAmount).toBe('4180000.00')
      expect(preview.isDiscountExceeded).toBe(false)
    })

    it('detects when discount exceeds subtotal', () => {
      const items = [
        { productId: 'p1', quantity: '1', unitPrice: '500000.00' },
      ]
      const preview = calculateQuotationPreview(items, '600000.00', '10.00')
      expect(preview.isDiscountExceeded).toBe(true)
    })
  })

  describe('toCreateQuotationPayload', () => {
    it('creates payload with only items (productId, quantity), discount, tax, and terms; NEVER sending unitPrice or totals', () => {
      const formValues = {
        items: [
          { productId: validUuid1, quantity: '2' },
          { productId: validUuid2, quantity: '1.5' },
        ],
        discountAmount: '100000',
        taxRate: '10',
        validUntil: tomorrow,
        deliveryAddress: '  Hà Nội  ',
        paymentTerms: '  Trả ngay  ',
        notes: '  Lưu ý đóng gói  ',
      }

      const payload = toCreateQuotationPayload(formValues)

      expect(payload).toEqual({
        items: [
          { productId: validUuid1, quantity: '2.00' },
          { productId: validUuid2, quantity: '1.50' },
        ],
        discountAmount: '100000.00',
        taxRate: '10.00',
        validUntil: tomorrow,
        deliveryAddress: 'Hà Nội',
        paymentTerms: 'Trả ngay',
        notes: 'Lưu ý đóng gói',
      })

      // Explicit verification: never send price or total fields
      const rawPayload = payload as unknown as Record<string, unknown>
      expect(rawPayload.unitPrice).toBeUndefined()
      expect(rawPayload.lineTotal).toBeUndefined()
      expect(rawPayload.subtotal).toBeUndefined()
      expect(rawPayload.taxAmount).toBeUndefined()
      expect(rawPayload.totalAmount).toBeUndefined()
      expect(rawPayload.quotationNumber).toBeUndefined()
    })
  })
})
