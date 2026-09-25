import { useHealth } from '@/hooks/use-health'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function HealthIndicator({ className }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useHealth()

  let statusText = 'Online'
  let dotColor = 'bg-emerald-500'
  let description = 'Kết nối backend bình thường'

  if (isLoading) {
    statusText = 'Đang kiểm tra...'
    dotColor = 'bg-amber-400 animate-pulse'
    description = 'Đang kiểm tra kết nối tới backend'
  } else if (isError || !data || data.status !== 'ok') {
    statusText = 'Offline'
    dotColor = 'bg-rose-500'
    description = 'Không thể kết nối backend. Click để thử lại.'
  }

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={() => {
          void refetch()
        }}
        className={cn(
          'inline-flex items-center gap-2 text-xs text-sidebar-foreground/80 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded hover:bg-sidebar-accent/50',
          className
        )}
        aria-label={`Trạng thái kết nối backend: ${statusText}`}
      >
        <span className={cn('size-2 rounded-full shrink-0', dotColor)} />
        <span className="font-mono text-xs">Backend: {statusText}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  )
}
