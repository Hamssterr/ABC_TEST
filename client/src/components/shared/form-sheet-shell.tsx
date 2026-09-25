import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { AsyncButton } from '@/components/shared/async-button'

interface FormSheetShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  isSubmitting?: boolean
  submitText?: string
  submittingText?: string
  cancelText?: string
  onCancel?: () => void
  formId?: string
}

export function FormSheetShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  isSubmitting = false,
  submitText = 'Lưu thay đổi',
  submittingText = 'Đang lưu...',
  cancelText = 'Hủy',
  onCancel,
  formId,
}: FormSheetShellProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return
    onOpenChange(nextOpen)
  }

  const handleCancel = () => {
    if (isSubmitting) return
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col h-full bg-background"
        showCloseButton={!isSubmitting}
      >
        <SheetHeader className="p-6 border-b border-border text-left">
          <SheetTitle className="text-lg font-semibold text-foreground">
            {title}
          </SheetTitle>
          {description && (
            <SheetDescription className="text-sm text-muted-foreground mt-1">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        <SheetFooter className="p-4 border-t border-border bg-card flex-row justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
          <AsyncButton
            type="submit"
            form={formId}
            isLoading={isSubmitting}
            loadingText={submittingText}
          >
            {submitText}
          </AsyncButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
