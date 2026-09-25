import * as React from 'react'
import { Link } from 'react-router-dom'
import { Eye, Calendar, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { CurrencyText } from '@/components/shared/currency-text'
import { DateText } from '@/components/shared/date-text'
import type { QuotationListItem } from '@/types/quotation'

interface QuotationHistoryCardListProps {
  quotations: QuotationListItem[]
  paginationSlot?: React.ReactNode
}

export function QuotationHistoryCardList({
  quotations,
  paginationSlot,
}: QuotationHistoryCardListProps) {
  return (
    <div className="space-y-3">
      {quotations.map((item) => (
        <Card key={item.quotationId} className="shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <Link
                  to={`/quotations/${item.quotationId}`}
                  className="font-mono text-sm font-semibold text-primary hover:underline flex items-center gap-1.5"
                >
                  <FileText className="size-4" />
                  <span>{item.quotationNumber}</span>
                </Link>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" />
                  <span>Ngày tạo: </span>
                  <DateText date={item.createdAt} />
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={item.status} />
                {item.jobStatus && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    Job: <StatusBadge status={item.jobStatus} />
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-border/50 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Hiệu lực đến: </span>
                <span className="text-xs font-medium">
                  <DateText date={item.validUntil} />
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground mr-1.5">Tổng tiền:</span>
                <span className="font-mono font-bold text-foreground">
                  <CurrencyText amount={item.totalAmount} />
                </span>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <Button variant="outline" size="sm" asChild className="w-full h-8 gap-1.5">
                <Link to={`/quotations/${item.quotationId}`}>
                  <Eye className="size-3.5" />
                  <span>Xem chi tiết</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {paginationSlot && <div className="pt-2">{paginationSlot}</div>}
    </div>
  )
}
