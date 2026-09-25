import { z } from 'zod'
import { Decimal } from 'decimal.js'
import type { CreateQuotationInput } from '@/types/quotation'

export const quotationItemFormSchema = z.object({
  productId: z
    .string()
    .uuid('Mã sản phẩm không hợp lệ')
    .min(1, 'Vui lòng chọn sản phẩm'),
  quantity: z
    .string()
    .min(1, 'Số lượng không được để trống')
    .regex(
      /^(?!0(\.0+)?$)\d+(\.\d{1,2})?$/,
      'Số lượng phải là số dương lớn hơn 0 và tối đa 2 chữ số thập phân'
    ),
})

export const quotationFormSchema = z
  .object({
    items: z
      .array(quotationItemFormSchema)
      .min(1, 'Báo giá phải có ít nhất một sản phẩm')
      .refine(
        (items) => {
          const ids = items.map((i) => i.productId).filter(Boolean)
          return new Set(ids).size === ids.length
        },
        {
          message: 'Không được chọn trùng sản phẩm trong các dòng báo giá',
          path: ['items'],
        }
      ),
    discountAmount: z
      .string()
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Chiết khấu phải là số không âm với tối đa 2 chữ số thập phân'
      ),
    taxRate: z
      .string()
      .regex(
        /^(100(\.00?)?|[0-9]{1,2}(\.[0-9]{1,2})?)$/,
        'Thuế suất VAT phải từ 0% đến 100% với tối đa 2 chữ số thập phân'
      ),
    validUntil: z
      .string()
      .min(1, 'Ngày hết hạn là bắt buộc')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD')
      .refine(
        (val) => {
          const today = new Date().toISOString().slice(0, 10)
          return val >= today
        },
        {
          message: 'Ngày hiệu lực không được ở trong quá khứ',
        }
      ),
    deliveryAddress: z.string().optional(),
    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
  })

export type QuotationFormValues = z.infer<typeof quotationFormSchema>

export interface QuotationCalculationItemInput {
  productId: string
  quantity: string
  unitPrice: string
}

export interface QuotationPreviewCalculation {
  lineTotals: Record<string, string> // productId -> lineTotal
  subtotal: string
  discountAmount: string
  taxRate: string
  taxAmount: string
  totalAmount: string
  isDiscountExceeded: boolean
}

/**
 * Calculates realtime financial summary with Decimal.js matching backend logic exactly:
 * - lineTotal = quantity * unitPrice (ROUND_HALF_UP 2 decimal places)
 * - subtotal = sum(lineTotal)
 * - taxableAmount = subtotal - discountAmount
 * - taxAmount = taxableAmount * taxRate / 100 (ROUND_HALF_UP 2 decimal places)
 * - totalAmount = taxableAmount + taxAmount (ROUND_HALF_UP 2 decimal places)
 */
export function calculateQuotationPreview(
  items: QuotationCalculationItemInput[],
  discountAmountStr = '0.00',
  taxRateStr = '10.00'
): QuotationPreviewCalculation {
  const lineTotals: Record<string, string> = {}
  let subtotalDec = new Decimal(0)

  for (const item of items) {
    if (!item.productId) continue

    let lineTotalDec = new Decimal(0)
    try {
      const qDec = new Decimal(item.quantity || '0')
      const pDec = new Decimal(item.unitPrice || '0')
      if (qDec.greaterThan(0) && pDec.greaterThanOrEqualTo(0)) {
        lineTotalDec = qDec.times(pDec).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      }
    } catch {
      lineTotalDec = new Decimal(0)
    }

    lineTotals[item.productId] = lineTotalDec.toFixed(2)
    subtotalDec = subtotalDec.plus(lineTotalDec)
  }

  let discountDec = new Decimal(0)
  try {
    const parsed = new Decimal(discountAmountStr || '0')
    if (parsed.greaterThanOrEqualTo(0)) {
      discountDec = parsed
    }
  } catch {
    discountDec = new Decimal(0)
  }

  const isDiscountExceeded = discountDec.greaterThan(subtotalDec)

  let taxRateDec = new Decimal(10)
  try {
    const parsed = new Decimal(taxRateStr || '0')
    if (parsed.greaterThanOrEqualTo(0) && parsed.lessThanOrEqualTo(100)) {
      taxRateDec = parsed
    }
  } catch {
    taxRateDec = new Decimal(10)
  }

  const taxableAmountDec = Decimal.max(0, subtotalDec.minus(discountDec))
  const taxAmountDec = taxableAmountDec
    .times(taxRateDec)
    .dividedBy(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const totalAmountDec = taxableAmountDec
    .plus(taxAmountDec)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  return {
    lineTotals,
    subtotal: subtotalDec.toFixed(2),
    discountAmount: discountDec.toFixed(2),
    taxRate: taxRateDec.toFixed(2),
    taxAmount: taxAmountDec.toFixed(2),
    totalAmount: totalAmountDec.toFixed(2),
    isDiscountExceeded,
  }
}

/**
 * Transforms form values into backend CreateQuotationInput.
 * Notice: frontend NEVER sends unitPrice, lineTotal, subtotal, taxAmount, or totalAmount.
 */
export function toCreateQuotationPayload(
  values: QuotationFormValues
): CreateQuotationInput {
  return {
    items: values.items.map((item) => ({
      productId: item.productId,
      quantity: new Decimal(item.quantity).toFixed(2),
    })),
    discountAmount: values.discountAmount
      ? new Decimal(values.discountAmount).toFixed(2)
      : '0.00',
    taxRate: values.taxRate
      ? new Decimal(values.taxRate).toFixed(2)
      : '10.00',
    validUntil: values.validUntil,
    deliveryAddress: values.deliveryAddress?.trim() || undefined,
    paymentTerms: values.paymentTerms?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  }
}
