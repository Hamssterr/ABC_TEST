import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ProductActions } from './product-actions'
import { CurrencyText } from '@/components/shared/currency-text'
import { DateText } from '@/components/shared/date-text'
import type { Product } from '@/types/product'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-[130px] font-semibold text-xs text-foreground uppercase tracking-wider">
            SKU
          </TableHead>
          <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Tên sản phẩm
          </TableHead>
          <TableHead className="w-[100px] font-semibold text-xs text-foreground uppercase tracking-wider">
            Đơn vị
          </TableHead>
          <TableHead className="w-[150px] font-semibold text-xs text-foreground uppercase tracking-wider text-right">
            Đơn giá
          </TableHead>
          <TableHead className="w-[130px] font-semibold text-xs text-foreground uppercase tracking-wider text-center">
            Trạng thái
          </TableHead>
          <TableHead className="w-[120px] font-semibold text-xs text-foreground uppercase tracking-wider">
            Cập nhật
          </TableHead>
          <TableHead className="w-[70px] text-right font-semibold text-xs text-foreground uppercase tracking-wider">
            Thao tác
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className="hover:bg-muted/40 transition-colors">
            <TableCell className="font-mono text-xs font-semibold text-primary">
              {product.sku}
            </TableCell>
            <TableCell>
              <div className="font-medium text-foreground">{product.name}</div>
              {product.description && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {product.description}
                </div>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {product.unit}
            </TableCell>
            <TableCell className="text-right">
              <CurrencyText
                value={product.unitPrice}
                className="font-semibold text-foreground"
              />
            </TableCell>
            <TableCell className="text-center">
              {product.isActive ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium"
                >
                  Đang bán
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium"
                >
                  Tạm ngưng
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              <DateText date={product.updatedAt || product.createdAt} />
            </TableCell>
            <TableCell className="text-right">
              <ProductActions
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
