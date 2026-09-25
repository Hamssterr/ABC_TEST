import { format, parseISO, isValid } from 'date-fns'

export function formatCurrency(
  value: number | string | null | undefined,
  fallback = '0 ₫'
): string {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) {
    return fallback
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(
  date: Date | string | number | null | undefined,
  formatPattern = 'dd/MM/yyyy',
  fallback = '—'
): string {
  if (!date) return fallback

  let parsed: Date
  if (typeof date === 'string') {
    parsed = parseISO(date)
    if (!isValid(parsed)) {
      parsed = new Date(date)
    }
  } else if (typeof date === 'number') {
    parsed = new Date(date)
  } else {
    parsed = date
  }

  if (!isValid(parsed)) {
    return fallback
  }

  return format(parsed, formatPattern)
}

export function formatDateTime(
  date: Date | string | number | null | undefined,
  fallback = '—'
): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm', fallback)
}
