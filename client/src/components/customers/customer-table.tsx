import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CustomerActions } from './customer-actions'
import { DateText } from '@/components/shared/date-text'
import type { Customer } from '@/types/customer'

interface CustomerTableProps {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-[120px] font-semibold text-xs text-foreground uppercase tracking-wider">
            Mã KH
          </TableHead>
          <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Tên khách hàng
          </TableHead>
          <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Công ty
          </TableHead>
          <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Email
          </TableHead>
          <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Điện thoại
          </TableHead>
          <TableHead className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Ngày tạo
          </TableHead>
          <TableHead className="w-[70px] text-right font-semibold text-xs text-foreground uppercase tracking-wider">
            Thao tác
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id} className="hover:bg-muted/40 transition-colors">
            <TableCell className="font-mono text-xs font-semibold text-primary">
              {customer.code}
            </TableCell>
            <TableCell className="font-medium">
              <Link
                to={`/customers/${customer.id}`}
                className="hover:text-primary transition-colors font-medium hover:underline"
              >
                {customer.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {customer.companyName || '—'}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {customer.email || '—'}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm font-mono">
              {customer.phone || '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              <DateText date={customer.createdAt} />
            </TableCell>
            <TableCell className="text-right">
              <CustomerActions
                customer={customer}
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
