import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  isDeleting?: boolean
  onConfirm: () => void
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = 'Xác nhận xóa',
  description,
  itemName,
  isDeleting = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const defaultDescription = itemName
    ? `Bạn có chắc chắn muốn xóa "${itemName}" không? Hành động này không thể hoàn tác.`
    : 'Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="size-4 animate-spin mr-2" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
