import { AlertCircle } from 'lucide-react'

interface UnresolvedFieldsAlertProps {
  unresolvedFields: string[]
}

const FIELD_LABELS: Record<string, string> = {
  deliveryAddress: 'Địa chỉ giao hàng',
  paymentTerms: 'Điều khoản thanh toán',
  validityDays: 'Thời hạn hiệu lực báo giá',
  notes: 'Ghi chú bổ sung',
}

function formatFieldName(field: string): string {
  if (FIELD_LABELS[field]) {
    return FIELD_LABELS[field]
  }

  // Handle items[i].quantity pattern
  const quantityMatch = field.match(/items\[(\d+)\]\.quantity/i)
  if (quantityMatch) {
    const idx = parseInt(quantityMatch[1], 10) + 1
    return `Số lượng cho dòng sản phẩm #${idx}`
  }

  // Handle items[i].productQuery pattern
  const productMatch = field.match(/items\[(\d+)\]\.productQuery/i)
  if (productMatch) {
    const idx = parseInt(productMatch[1], 10) + 1
    return `Sản phẩm cho dòng #${idx}`
  }

  return field
}

export function UnresolvedFieldsAlert({
  unresolvedFields,
}: UnresolvedFieldsAlertProps) {
  if (!unresolvedFields || unresolvedFields.length === 0) {
    return null
  }

  return (
    <div
      role="alert"
      className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1.5"
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Các trường thông tin AI chưa xác định đầy đủ:</span>
      </div>
      <ul className="list-disc list-inside space-y-0.5 pl-6 text-amber-800 dark:text-amber-300">
        {unresolvedFields.map((field, idx) => (
          <li key={idx}>
            <span className="font-semibold">{formatFieldName(field)}</span>
            <span className="text-muted-foreground ml-1">
              (bạn có thể bổ sung thủ công trên biểu mẫu)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
