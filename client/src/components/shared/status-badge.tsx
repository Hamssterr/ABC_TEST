import type { QuotationJobStatus } from '@/types/common'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: QuotationJobStatus | string
  className?: string
}

const statusConfig: Record<
  QuotationJobStatus,
  { label: string; className: string }
> = {
  SUBMITTED: {
    label: 'Đã gửi',
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  PENDING: {
    label: 'Đang chờ',
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  PROCESSING: {
    label: 'Đang xử lý',
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  FAILED: {
    label: 'Thất bại',
    className: 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as QuotationJobStatus] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-800 border-slate-200',
  }

  return (
    <Badge
      variant="outline"
      className={cn('font-medium text-xs px-2.5 py-0.5 rounded-full', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
