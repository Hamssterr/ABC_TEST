import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface CurrencyTextProps {
  value?: number | string | null
  amount?: number | string | null
  className?: string
  fallback?: string
}

export function CurrencyText({
  value,
  amount,
  className,
  fallback = '0 ₫',
}: CurrencyTextProps) {
  const val = value !== undefined ? value : amount
  return (
    <span className={cn('tabular-nums font-medium', className)}>
      {formatCurrency(val, fallback)}
    </span>
  )
}
