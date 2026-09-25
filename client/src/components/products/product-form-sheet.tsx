import * as React from 'react'
import { FormSheetShell } from '@/components/shared/form-sheet-shell'
import { ProductForm } from './product-form'
import type { Product } from '@/types/product'

interface ProductFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
}: ProductFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = Boolean(product)
  const formId = 'product-form-id'

  return (
    <FormSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      description={
        isEditing
          ? `Cập nhật thông tin và đơn giá cho SKU ${product?.sku}`
          : 'Điền thông tin và đơn giá để tạo mới sản phẩm trong hệ thống'
      }
      formId={formId}
      isSubmitting={isSubmitting}
      submitText={isEditing ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
      submittingText={isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
    >
      <ProductForm
        product={product}
        formId={formId}
        onSuccess={() => onOpenChange(false)}
        setIsSubmitting={setIsSubmitting}
      />
    </FormSheetShell>
  )
}
