import { Link } from 'react-router-dom'
import {
  MoreHorizontal,
  Eye,
  FileText,
  Sparkles,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Customer } from '@/types/customer'

interface CustomerActionsProps {
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerActions({
  customer,
  onEdit,
  onDelete,
}: CustomerActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 p-0"
          aria-label={`Mở thao tác cho khách hàng ${customer.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link
            to={`/customers/${customer.id}`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Eye className="size-4 text-muted-foreground" />
            <span>Xem chi tiết</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to={`/customers/${customer.id}/quotations/new?mode=manual`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FileText className="size-4 text-muted-foreground" />
            <span>Tạo báo giá</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            to={`/customers/${customer.id}/quotations/new?mode=ai`}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="size-4 text-primary" />
            <span>Báo giá với AI</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onEdit(customer)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Pencil className="size-4 text-muted-foreground" />
          <span>Chỉnh sửa</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDelete(customer)}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="size-4" />
          <span>Xóa khách hàng</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
