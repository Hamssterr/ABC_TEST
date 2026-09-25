import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductActions } from './product-actions'
import { CurrencyText } from '@/components/shared/currency-text'
import type { Product } from '@/types/product'

interface ProductCardListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductCardList({
  products,
  onEdit,
  onDelete,
}: ProductCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {products.map((product) => (
        <Card key={product.id} className="shadow-xs hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {product.sku}
                </span>
                <h3 className="font-semibold text-base text-foreground mt-1.5 leading-snug">
                  {product.name}
                </h3>
              </div>
              <ProductActions
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>

            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="text-xs text-muted-foreground">
                Đơn vị: <span className="font-medium text-foreground">{product.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <CurrencyText
                  value={product.unitPrice}
                  className="font-bold text-sm text-foreground"
                />
                {product.isActive ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] px-1.5 py-0"
                  >
                    Đang bán
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-slate-100 text-slate-600 border-slate-200 text-[11px] px-1.5 py-0"
                  >
                    Tạm ngưng
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
