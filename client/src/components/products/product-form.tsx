import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyText } from '@/components/shared/currency-text'
import {
  productSchema,
  toCreateProductPayload,
  toUpdateProductPayload,
} from '@/schemas/product-schema'
import type { Product, ProductFormValues } from '@/types/product'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products'

interface ProductFormProps {
  product?: Product | null
  formId: string
  onSuccess: () => void
  setIsSubmitting: (isSubmitting: boolean) => void
}

export function ProductForm({
  product,
  formId,
  onSuccess,
  setIsSubmitting,
}: ProductFormProps) {
  const isEditing = Boolean(product)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: product?.sku ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      unit: product?.unit ?? '',
      unitPrice: product?.unitPrice ?? '',
      isActive: product?.isActive ?? true,
    },
  })

  // Watch unitPrice for real-time Vietnamese currency preview
  const watchedPrice = useWatch({ control: form.control, name: 'unitPrice' })

  React.useEffect(() => {
    form.reset({
      sku: product?.sku ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      unit: product?.unit ?? '',
      unitPrice: product?.unitPrice ?? '',
      isActive: product?.isActive ?? true,
    })
  }, [product, form])

  const createMutation = useCreateProduct({
    onSuccess: () => {
      form.reset()
      onSuccess()
    },
  })

  const updateMutation = useUpdateProduct({
    onSuccess: () => {
      onSuccess()
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  React.useEffect(() => {
    setIsSubmitting(isPending)
  }, [isPending, setIsSubmitting])

  const onSubmit = (values: ProductFormValues) => {
    if (isEditing && product) {
      const payload = toUpdateProductPayload(values)
      updateMutation.mutate({ id: product.id, input: payload })
    } else {
      const payload = toCreateProductPayload(values)
      createMutation.mutate(payload)
    }
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mã SKU <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: NHOM-XF-01"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  disabled={isPending}
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tên sản phẩm <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: Cửa nhôm Xingfa 4 cánh"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Đơn vị tính <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="VD: m², bộ, cái..."
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Đơn giá (VNĐ) <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="VD: 1850000"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                {watchedPrice && (
                  <FormDescription className="text-xs">
                    Xem trước:{' '}
                    <CurrencyText
                      value={watchedPrice}
                      className="text-foreground font-semibold"
                    />
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả quy cách</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Thông số kỹ thuật, hệ nhôm, màu sơn..."
                  rows={3}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0 rounded-md border border-border p-3 bg-muted/20">
              <FormControl>
                <input
                  type="checkbox"
                  id="product-is-active"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={isPending}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
              </FormControl>
              <div className="space-y-0.5">
                <FormLabel htmlFor="product-is-active" className="cursor-pointer font-medium text-sm">
                  Kích hoạt kinh doanh
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Sản phẩm đang kinh doanh sẽ hiển thị trong danh mục tạo báo giá.
                </p>
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
