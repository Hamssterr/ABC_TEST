import { z } from 'zod';
import { Decimal } from 'decimal.js';
import type { ExtractedQuotationDraft } from '../extractors/quotation-draft-extractor.interface.js';

export function normalizeQuantity(val: unknown): string | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  if (typeof val !== 'string' && typeof val !== 'number') {
    return null;
  }
  try {
    const d = new Decimal(val);
    if (!d.isFinite() || d.isNaN() || d.lessThanOrEqualTo(0)) {
      return null;
    }
    // Allow up to 2 decimal places as required by schema
    return d.toFixed(2);
  } catch {
    return null;
  }
}

export const rawExtractedItemSchema = z
  .object({
    productQuery: z.string().trim().min(1, 'productQuery cannot be empty'),
    quantity: z.union([z.string(), z.number(), z.null()]).optional().nullable(),
  })
  .strict();

export const rawExtractedDraftSchema = z
  .object({
    items: z.array(rawExtractedItemSchema),
    deliveryAddress: z.string().trim().nullable().optional(),
    paymentTerms: z.string().trim().nullable().optional(),
    validityDays: z
      .number()
      .int()
      .min(1, 'validityDays must be at least 1')
      .max(365, 'validityDays cannot exceed 365')
      .nullable()
      .optional(),
    notes: z.string().trim().nullable().optional(),
    unresolvedFields: z.array(z.string().trim()).optional().default([]),
  })
  .strict();

export type RawExtractedDraft = z.infer<typeof rawExtractedDraftSchema>;

export function parseAndNormalizeDraft(json: unknown): ExtractedQuotationDraft {
  const parsed = rawExtractedDraftSchema.parse(json);

  const unresolvedFields: string[] = [...(parsed.unresolvedFields || [])];

  const items = (parsed.items || []).map((item) => {
    const normalizedQty = normalizeQuantity(item.quantity);
    if (normalizedQty === null) {
      unresolvedFields.push(
        `Thiếu số lượng hợp lệ cho sản phẩm "${item.productQuery}"`,
      );
    }
    return {
      productQuery: item.productQuery,
      quantity: normalizedQty,
    };
  });

  return {
    items,
    deliveryAddress: parsed.deliveryAddress || null,
    paymentTerms: parsed.paymentTerms || null,
    validityDays:
      typeof parsed.validityDays === 'number' ? parsed.validityDays : null,
    notes: parsed.notes || null,
    unresolvedFields,
  };
}
