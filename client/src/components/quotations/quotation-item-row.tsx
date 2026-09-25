import { Trash2 } from 'lucide-react'
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductCombobox } from '@/components/products/product-combobox'
import { formatCurrency } from '@/lib/formatters'
import type { Product } from '@/types/product'
import type { QuotationFormValues } from '@/schemas/quotation-schema'

interface QuotationItemRowProps {
  index: number
  control: Control<QuotationFormValues>
  setValue: UseFormSetValue<QuotationFormValues>
  errors: FieldErrors<QuotationFormValues>
  canRemove: boolean
  onRemove: () => void
  excludedProductIds: string[]
  selectedProduct?: Product
  onProductSelect: (index: number, product?: Product) => void
  lineTotal?: string
  isSubmitting?: boolean
  extraProducts?: Product[]
}

export function QuotationItemRow({
  index,
  control,
  setValue,
  errors,
  canRemove,
  onRemove,
  excludedProductIds,
  selectedProduct,
  onProductSelect,
  lineTotal = '0.00',
  isSubmitting = false,
  extraProducts = [],
}: QuotationItemRowProps) {
  const itemError = errors.items?.[index]

  return (
    <div className="p-3.5 sm:p-4 rounded-lg border border-border/80 bg-card space-y-3 transition-colors hover:border-primary/40">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Product selector */}
        <div className="md:col-span-5 space-y-1">
          <label className="text-xs font-medium text-muted-foreground block md:hidden">
            Sản phẩm <span className="text-destructive">*</span>
          </label>
          <Controller
            control={control}
            name={`items.${index}.productId`}
            render={({ field }) => (
              <ProductCombobox
                value={field.value}
                onValueChange={(productId, product) => {
                  field.onChange(productId)
                  setValue(`items.${index}.productId`, productId, {
                    shouldValidate: true,
                  })
                  onProductSelect(index, product)
                }}
                disabled={isSubmitting}
                excludeProductIds={excludedProductIds}
                placeholder="Chọn sản phẩm trong danh mục..."
                extraProducts={extraProducts}
              />
            )}
          />
          {itemError?.productId && (
            <p className="text-xs text-destructive mt-1">
              {itemError.productId.message}
            </p>
          )}
        </div>

        {/* Quantity input */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground block md:hidden">
            Số lượng <span className="text-destructive">*</span>
          </label>
          <Controller
            control={control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                inputMode="decimal"
                placeholder="Ví dụ: 1 hoặc 2.5"
                disabled={isSubmitting}
                className="font-mono text-sm h-10"
              />
            )}
          />
          {itemError?.quantity && (
            <p className="text-xs text-destructive mt-1">
              {itemError.quantity.message}
            </p>
          )}
        </div>

        {/* Unit & Unit price reference */}
        <div className="md:col-span-2 flex flex-col justify-center h-10 px-2 py-1 rounded bg-muted/40 text-xs">
          <span className="text-muted-foreground font-medium text-[11px] md:hidden">
            Đơn giá tham khảo:
          </span>
          <div className="font-mono font-medium text-foreground truncate">
            {selectedProduct ? formatCurrency(selectedProduct.unitPrice) : '—'}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {selectedProduct?.unit ? `ĐVT: ${selectedProduct.unit}` : 'Đơn vị tính'}
          </span>
        </div>

        {/* Line total preview */}
        <div className="md:col-span-2 flex flex-col justify-center h-10 px-2 py-1 rounded bg-primary/5 border border-primary/10 text-xs text-right">
          <span className="text-muted-foreground font-medium text-[11px] md:hidden text-left">
            Thành tiền dự kiến:
          </span>
          <div className="font-mono font-bold text-primary tabular-nums">
            {formatCurrency(lineTotal)}
          </div>
          <span className="text-[10px] text-muted-foreground">Tạm tính</span>
        </div>

        {/* Delete row action */}
        <div className="md:col-span-1 flex justify-end md:justify-center items-center h-10">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={!canRemove || isSubmitting}
            title={canRemove ? 'Xóa dòng sản phẩm này' : 'Báo giá phải có ít nhất 1 sản phẩm'}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-9"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Xóa dòng {index + 1}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
