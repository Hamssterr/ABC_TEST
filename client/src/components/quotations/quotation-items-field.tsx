import { Plus, Package } from 'lucide-react'
import type {
  Control,
  FieldErrors,
  UseFieldArrayReturn,
  UseFormSetValue,
} from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { QuotationItemRow } from './quotation-item-row'
import type { Product } from '@/types/product'
import type { QuotationFormValues } from '@/schemas/quotation-schema'

interface QuotationItemsFieldProps {
  control: Control<QuotationFormValues>
  setValue: UseFormSetValue<QuotationFormValues>
  fieldArray: UseFieldArrayReturn<QuotationFormValues, 'items'>
  errors: FieldErrors<QuotationFormValues>
  productsMap: Map<string, Product>
  onProductSelect: (index: number, product?: Product) => void
  lineTotals: Record<string, string>
  isSubmitting?: boolean
  extraProducts?: Product[]
}

export function QuotationItemsField({
  control,
  setValue,
  fieldArray,
  errors,
  productsMap,
  onProductSelect,
  lineTotals,
  isSubmitting = false,
  extraProducts = [],
}: QuotationItemsFieldProps) {
  const { fields, append, remove } = fieldArray

  const watchedItems = useWatch({ control, name: 'items' })

  const selectedProductIds = (watchedItems || [])
    .map((item) => item?.productId)
    .filter(Boolean) as string[]

  const handleAddItem = () => {
    append({ productId: '', quantity: '1' })
  }

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const rootItemsError = errors.items?.message || errors.items?.root?.message

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Danh mục sản phẩm báo giá ({fields.length})
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={isSubmitting}
          className="gap-1.5 h-8 text-xs font-medium"
        >
          <Plus className="size-3.5" />
          <span>Thêm dòng</span>
        </Button>
      </div>

      {/* Desktop Column Header */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/40 rounded-md">
        <div className="md:col-span-5">Sản phẩm</div>
        <div className="md:col-span-2">Số lượng</div>
        <div className="md:col-span-2">Đơn giá / ĐVT</div>
        <div className="md:col-span-2 text-right">Thành tiền tạm tính</div>
        <div className="md:col-span-1 text-center">Xóa</div>
      </div>

      {/* Items list */}
      <div className="space-y-2.5">
        {fields.map((field, index) => {
          const currentProductId = watchedItems?.[index]?.productId || ''
          const selectedProduct = productsMap.get(currentProductId)
          const excludedIds = selectedProductIds.filter(
            (id) => id !== currentProductId
          )

          return (
            <QuotationItemRow
              key={field.id}
              index={index}
              control={control}
              setValue={setValue}
              errors={errors}
              canRemove={fields.length > 1}
              onRemove={() => handleRemoveItem(index)}
              excludedProductIds={excludedIds}
              selectedProduct={selectedProduct}
              onProductSelect={onProductSelect}
              lineTotal={lineTotals[currentProductId] || '0.00'}
              isSubmitting={isSubmitting}
              extraProducts={extraProducts}
            />
          )
        })}
      </div>

      {rootItemsError && (
        <p className="text-xs font-medium text-destructive pt-1">
          {rootItemsError}
        </p>
      )}
    </div>
  )
}
