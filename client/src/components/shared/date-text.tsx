import { formatDate, formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface DateTextProps {
  date: Date | string | number | null | undefined
  withTime?: boolean
  className?: string
  fallback?: string
}

export function DateText({
  date,
  withTime = false,
  className,
  fallback = '—',
}: DateTextProps) {
  const text = withTime ? formatDateTime(date, fallback) : formatDate(date, 'dd/MM/yyyy', fallback)
  return <span className={cn('text-sm', className)}>{text}</span>
}
