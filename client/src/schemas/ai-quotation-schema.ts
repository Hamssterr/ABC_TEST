import { z } from 'zod'
import { addDays, format, isValid } from 'date-fns'
import type { QuotationDraftItem } from '@/types/ai'

export const aiDraftInputSchema = z.object({
  rawRequest: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(1, 'Vui lòng nhập nội dung yêu cầu báo giá.')
        .max(5000, 'Nội dung yêu cầu không được vượt quá 5000 ký tự.')
    ),
})

export type AiDraftInputValues = z.infer<typeof aiDraftInputSchema>

/**
 * Safely converts AI validityDays integer to a YYYY-MM-DD string.
 * Returns null if validityDays is missing, zero, or non-finite.
 */
export function convertValidityDaysToDate(
  validityDays: number | null | undefined,
  baseDate: Date = new Date()
): string | null {
  if (
    validityDays === null ||
    validityDays === undefined ||
    !Number.isFinite(validityDays) ||
    validityDays <= 0
  ) {
    return null
  }

  const targetDate = addDays(baseDate, Math.round(validityDays))
  if (!isValid(targetDate)) {
    return null
  }

  return format(targetDate, 'yyyy-MM-dd')
}

/**
 * Resolves the chosen candidate product ID for an AI draft item.
 * - If 1 candidate exists: auto-selects that candidate ID.
 * - If multiple candidates exist: prefers explicit user choice, falls back to empty.
 * - If 0 candidates exist: returns empty string.
 */
export function resolveCandidateProductId(
  item: QuotationDraftItem,
  itemIndex: number,
  userSelectedCandidateIds: Record<number, string>
): string {
  if (item.candidates.length === 1) {
    return item.candidates[0].id
  }

  if (item.candidates.length > 1) {
    const selected = userSelectedCandidateIds[itemIndex]
    if (selected && item.candidates.some((c) => c.id === selected)) {
      return selected
    }
    return ''
  }

  return ''
}

/**
 * Helper to determine if an AI draft item is considered resolved.
 * A draft item is resolved if:
 * 1. A candidate product ID is resolved (or explicitly left empty for manual selection if 0 candidates).
 * 2. Quantity is non-null, non-empty, and valid numeric > 0.
 */
export function isDraftItemResolved(
  item: QuotationDraftItem,
  itemIndex: number,
  userSelectedCandidateIds: Record<number, string>
): boolean {
  const hasValidQuantity =
    item.quantity !== null &&
    item.quantity !== undefined &&
    item.quantity.trim() !== '' &&
    !Number.isNaN(Number(item.quantity)) &&
    Number(item.quantity) > 0

  if (!hasValidQuantity) {
    return false
  }

  if (item.candidates.length > 1) {
    return Boolean(userSelectedCandidateIds[itemIndex])
  }

  return true
}
