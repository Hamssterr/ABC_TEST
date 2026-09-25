import { RotateCw, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AsyncButton } from '@/components/shared/async-button'

interface RetryJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  isRetrying: boolean
  attemptCount: number
  maxAttempts?: number
}

export function RetryJobDialog({
  open,
  onOpenChange,
  onConfirm,
  isRetrying,
  attemptCount,
  maxAttempts = 3,
}: RetryJobDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="size-5" />
            <AlertDialogTitle>Thử lại xử lý báo giá</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2 text-sm text-foreground/80 pt-2">
            <p>
              Tiến trình tạo tài liệu cho báo giá đã gặp lỗi. Bạn có muốn đưa yêu cầu vào hàng đợi để thử lại không?
            </p>
            <div className="p-3 bg-muted rounded-md text-xs font-mono space-y-1">
              <div>Số lần đã thử: <span className="font-semibold text-foreground">{attemptCount}</span> / {maxAttempts}</div>
              <div>Trạng thái sau khi thử lại: <span className="font-semibold text-amber-600">PENDING (Đang chờ)</span></div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRetrying}>Hủy</AlertDialogCancel>
          <AsyncButton
            onClick={handleConfirm}
            isLoading={isRetrying}
            loadingText="Đang gửi yêu cầu..."
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RotateCw className="size-4" />
            <span>Xác nhận thử lại</span>
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
