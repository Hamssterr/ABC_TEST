import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TablePaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (newPage: number) => void
}

export function TablePagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  if (total === 0) return null

  const from = Math.min((page - 1) * limit + 1, total)
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1">
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        Hiển thị <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> /{' '}
        <span className="font-medium text-foreground">{total}</span>
      </div>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="gap-1 h-8"
        >
          <ChevronLeft className="size-4" />
          <span>Trước</span>
        </Button>
        <span className="px-3 text-sm text-muted-foreground font-mono">
          Trang {page} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="gap-1 h-8"
        >
          <span>Sau</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
