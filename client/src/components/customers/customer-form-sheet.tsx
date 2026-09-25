import * as React from 'react'
import { FormSheetShell } from '@/components/shared/form-sheet-shell'
import { CustomerForm } from './customer-form'
import type { Customer } from '@/types/customer'

interface CustomerFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
}

export function CustomerFormSheet({
  open,
  onOpenChange,
  customer,
}: CustomerFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = Boolean(customer)
  const formId = 'customer-form-id'

  return (
    <FormSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
      description={
        isEditing
          ? `Cập nhật thông tin chi tiết cho khách hàng ${customer?.code}`
          : 'Điền thông tin để tạo mới khách hàng trong hệ thống'
      }
      formId={formId}
      isSubmitting={isSubmitting}
      submitText={isEditing ? 'Lưu thay đổi' : 'Tạo khách hàng'}
      submittingText={isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
    >
      <CustomerForm
        customer={customer}
        formId={formId}
        onSuccess={() => onOpenChange(false)}
        setIsSubmitting={setIsSubmitting}
      />
    </FormSheetShell>
  )
}
