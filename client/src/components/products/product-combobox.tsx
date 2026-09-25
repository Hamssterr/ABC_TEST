import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { formatCurrency } from '@/lib/formatters'
import { useProducts } from '@/hooks/use-products'
import type { Product } from '@/types/product'
import type { ProductCandidate } from '@/types/ai'
import { cn } from '@/lib/utils'

export interface ProductComboboxProps {
  value?: string
  onValueChange: (productId: string, product?: Product) => void
  disabled?: boolean
  excludeProductIds?: string[]
  placeholder?: string
  className?: string
  extraProducts?: (Product | ProductCandidate)[]
}

export function ProductCombobox({
  value,
  onValueChange,
  disabled = false,
  excludeProductIds = [],
  placeholder = 'Chọn sản phẩm...',
  className,
  extraProducts = [],
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Demo catalog fetch: page 1 with limit 100 for fast client-side selection
  const { data, isLoading, isError } = useProducts({ page: 1, limit: 100 })

  const allAvailableProducts = React.useMemo(() => {
    const list: Product[] = [...(data?.data ?? [])]
    if (extraProducts && extraProducts.length > 0) {
      const existingIds = new Set(list.map((p) => p.id))
      for (const ep of extraProducts) {
        if (!existingIds.has(ep.id)) {
          list.push({
            id: ep.id,
            sku: ep.sku,
            name: ep.name,
            description: ep.description ?? null,
            unit: ep.unit,
            unitPrice: ep.unitPrice,
            isActive: (ep as Product).isActive ?? true,
            createdAt: (ep as Product).createdAt ?? '',
            updatedAt: (ep as Product).updatedAt ?? '',
          })
          existingIds.add(ep.id)
        }
      }
    }
    return list
  }, [data, extraProducts])

  const products = React.useMemo(() => {
    return allAvailableProducts.filter(
      (p) =>
        p.isActive &&
        (p.id === value || !excludeProductIds.includes(p.id))
    )
  }, [allAvailableProducts, value, excludeProductIds])

  const selectedProduct = React.useMemo(
    () => allAvailableProducts.find((p) => p.id === value),
    [allAvailableProducts, value]
  )

  const handleSelect = (productId: string) => {
    const prod = allAvailableProducts.find((p) => p.id === productId)
    onValueChange(productId, prod)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            'w-full justify-between font-normal text-left h-10',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải danh mục...
            </span>
          ) : selectedProduct ? (
            <span className="truncate">
              <span className="font-mono text-xs font-semibold mr-1.5 text-primary">
                [{selectedProduct.sku}]
              </span>
              {selectedProduct.name} — {formatCurrency(selectedProduct.unitPrice)}/{selectedProduct.unit}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(380px,calc(100vw-2rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm theo mã SKU hoặc tên..." />
          <CommandList>
            {isError ? (
              <div className="py-6 text-center text-sm text-destructive">
                Không thể tải danh mục sản phẩm
              </div>
            ) : (
              <>
                <CommandEmpty>Không tìm thấy sản phẩm phù hợp.</CommandEmpty>
                <CommandGroup>
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.sku} ${product.name}`}
                      onSelect={() => handleSelect(product.id)}
                      className="flex items-center justify-between py-2 cursor-pointer"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 font-medium truncate">
                          <span className="font-mono text-xs text-primary font-semibold">
                            {product.sku}
                          </span>
                          <span className="truncate">{product.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(product.unitPrice)} / {product.unit}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          'size-4 shrink-0',
                          value === product.id ? 'opacity-100 text-primary' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
