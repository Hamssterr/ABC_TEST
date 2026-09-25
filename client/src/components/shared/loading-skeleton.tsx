import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full space-y-3', className)} data-testid="table-skeleton">
      <div className="flex items-center gap-4 py-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`th-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`row-${r}`} className="flex items-center gap-4 py-3 border-b border-border/40">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={`cell-${r}-${c}`} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function LoadingState({ message = 'Đang tải dữ liệu...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
