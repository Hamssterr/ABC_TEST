import * as React from 'react'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  FileCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { DateText } from '@/components/shared/date-text'
import { RetryJobDialog } from './retry-job-dialog'
import type { ProcessingJob, ProcessingJobStatus } from '@/types/processing-job'

interface JobStatusCardProps {
  job: ProcessingJob | null
  onRetry?: () => Promise<void> | void
  isRetrying?: boolean
}

export function JobStatusCard({
  job,
  onRetry,
  isRetrying = false,
}: JobStatusCardProps) {
  const [retryDialogOpen, setRetryDialogOpen] = React.useState(false)

  if (!job) {
    return (
      <Card className="shadow-xs border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Chưa có tiến trình xử lý tài liệu cho báo giá này.
        </CardContent>
      </Card>
    )
  }

  const { status, attemptCount, maxAttempts, errorMessage, fileName, completedAt } =
    job
  const isPending = status === ('PENDING' as ProcessingJobStatus)
  const isProcessing = status === ('PROCESSING' as ProcessingJobStatus)
  const isCompleted = status === ('COMPLETED' as ProcessingJobStatus)
  const isFailed = status === ('FAILED' as ProcessingJobStatus)
  const canRetry = isFailed && attemptCount < maxAttempts

  const handleConfirmRetry = async () => {
    if (onRetry) {
      await onRetry()
      setRetryDialogOpen(false)
    }
  }

  return (
    <>
      <Card
        className={`shadow-xs transition-colors ${
          isCompleted
            ? 'border-emerald-200 bg-emerald-50/20'
            : isFailed
            ? 'border-rose-200 bg-rose-50/20'
            : 'border-blue-200 bg-blue-50/20'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isPending && <Clock className="size-5 text-amber-600 animate-pulse" />}
              {isProcessing && <Loader2 className="size-5 text-blue-600 animate-spin" />}
              {isCompleted && <CheckCircle2 className="size-5 text-emerald-600" />}
              {isFailed && <AlertCircle className="size-5 text-rose-600" />}
              <CardTitle className="text-base font-semibold">
                Tiến trình xử lý tài liệu (Processing Job)
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-background border border-border">
                Lần thử: {attemptCount}/{maxAttempts}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1 text-sm">
          {(isPending || isProcessing) && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50/80 border border-blue-200 text-blue-800">
              <Loader2 className="size-4 animate-spin shrink-0" />
              <div className="text-xs">
                {isPending
                  ? 'Yêu cầu đang nằm trong hàng đợi. Hệ thống sẽ tự động bắt đầu xử lý sau vài giây...'
                  : 'Hệ thống đang tiến hành kết xuất tài liệu PDF và chuẩn bị tệp báo giá. Dữ liệu sẽ tự động cập nhật mà không cần tải lại trang.'}
              </div>
            </div>
          )}

          {isFailed && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <div className="font-semibold text-xs flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="size-3.5" />
                  <span>Xảy ra lỗi trong quá trình xử lý:</span>
                </div>
                <div className="text-xs font-mono break-all text-rose-800">
                  {errorMessage || 'Không xác định được nguyên nhân lỗi cụ thể từ worker.'}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {canRetry ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRetryDialogOpen(true)}
                    disabled={isRetrying}
                    className="gap-1.5 text-rose-700 border-rose-300 hover:bg-rose-50"
                  >
                    <RotateCw className="size-3.5" />
                    <span>Thử lại tiến trình (còn {maxAttempts - attemptCount} lần)</span>
                  </Button>
                ) : (
                  <div className="text-xs text-rose-600 font-medium">
                    Đã vượt quá số lần thử lại tối đa ({maxAttempts}/{maxAttempts}). Vui lòng liên hệ quản trị viên.
                  </div>
                )}
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              {fileName && (
                <div className="flex items-center gap-2 p-2.5 rounded bg-background border border-border">
                  <FileCheck className="size-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-muted-foreground block text-[11px]">Tên tệp đã tạo:</span>
                    <span className="font-mono font-medium text-foreground truncate block">
                      {fileName}
                    </span>
                  </div>
                </div>
              )}
              {completedAt && (
                <div className="flex items-center gap-2 p-2.5 rounded bg-background border border-border">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Thời điểm hoàn tất:</span>
                    <span className="font-medium text-foreground">
                      <DateText date={completedAt} withTime />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RetryJobDialog
        open={retryDialogOpen}
        onOpenChange={setRetryDialogOpen}
        onConfirm={handleConfirmRetry}
        isRetrying={isRetrying}
        attemptCount={attemptCount}
        maxAttempts={maxAttempts}
      />
    </>
  )
}
