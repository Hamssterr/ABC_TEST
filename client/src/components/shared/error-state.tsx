import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải được dữ liệu vào lúc này. Vui lòng thử lại.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5',
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-md">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-2 border-border"
        >
          <RefreshCw className="size-3.5" />
          Thử lại
        </Button>
      )}
    </div>
  )
}
