import Decimal from 'decimal.js'

export function toDecimal(value: string | number | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0)
  }
  try {
    return new Decimal(value)
  } catch {
    return new Decimal(0)
  }
}

export function formatDecimalNumber(value: string | number | Decimal | null | undefined): string {
  return toDecimal(value).toFixed(2)
}
