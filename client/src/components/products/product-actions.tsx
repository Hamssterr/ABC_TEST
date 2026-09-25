import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Product } from '@/types/product'

interface ProductActionsProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductActions({
  product,
  onEdit,
  onDelete,
}: ProductActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 p-0"
          aria-label={`Mở thao tác cho sản phẩm ${product.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => onEdit(product)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Pencil className="size-4 text-muted-foreground" />
          <span>Chỉnh sửa</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDelete(product)}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="size-4" />
          <span>Xóa sản phẩm</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
