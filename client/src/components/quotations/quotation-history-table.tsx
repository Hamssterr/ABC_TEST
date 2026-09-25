import * as React from 'react'
import { Link } from 'react-router-dom'
import { Eye, ArrowUpRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DataTableShell } from '@/components/shared/data-table-shell'
import { StatusBadge } from '@/components/shared/status-badge'
import { CurrencyText } from '@/components/shared/currency-text'
import { DateText } from '@/components/shared/date-text'
import type { QuotationListItem } from '@/types/quotation'

interface QuotationHistoryTableProps {
  quotations: QuotationListItem[]
  paginationSlot?: React.ReactNode
}

export function QuotationHistoryTable({
  quotations,
  paginationSlot,
}: QuotationHistoryTableProps) {
  return (
    <DataTableShell pagination={paginationSlot}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[180px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Số báo giá
            </TableHead>
            <TableHead className="w-[140px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Trạng thái
            </TableHead>
            <TableHead className="w-[140px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Tiến trình Job
            </TableHead>
            <TableHead className="text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Tổng tiền
            </TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Ngày hiệu lực
            </TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Ngày tạo
            </TableHead>
            <TableHead className="w-[100px] text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((item) => (
            <TableRow
              key={item.quotationId}
              className="hover:bg-muted/30 transition-colors group"
            >
              <TableCell className="font-mono text-sm font-semibold text-primary">
                <Link
                  to={`/quotations/${item.quotationId}`}
                  className="hover:underline flex items-center gap-1 inline-flex"
                >
                  <span>{item.quotationNumber}</span>
                  <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </TableCell>

              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>

              <TableCell>
                {item.jobStatus ? (
                  <StatusBadge status={item.jobStatus} />
                ) : (
                  <span className="text-xs text-muted-foreground">Chưa có</span>
                )}
              </TableCell>

              <TableCell className="text-right font-semibold font-mono text-foreground">
                <CurrencyText amount={item.totalAmount} />
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                <DateText date={item.validUntil} />
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                <DateText date={item.createdAt} />
              </TableCell>

              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild className="h-8 gap-1">
                  <Link to={`/quotations/${item.quotationId}`}>
                    <Eye className="size-3.5" />
                    <span className="text-xs">Xem</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableShell>
  )
}
