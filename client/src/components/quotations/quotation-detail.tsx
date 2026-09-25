import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  FileText,
  Package,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'
import { CurrencyText } from '@/components/shared/currency-text'
import { DateText } from '@/components/shared/date-text'
import { JobStatusCard } from './job-status-card'
import { QuotationDownloadActions } from './quotation-download-actions'
import type { Quotation } from '@/types/quotation'
import type { ProcessingJob } from '@/types/processing-job'

interface QuotationDetailProps {
  quotation: Quotation
  job: ProcessingJob | null
  onRetryJob?: () => Promise<void> | void
  isRetryingJob?: boolean
  onDownloadPdf: (quotationId: string) => Promise<void> | void
  onDownloadExcel: (quotationId: string, quotationNumber?: string) => Promise<void> | void
  isDownloadingPdf?: boolean
  isDownloadingExcel?: boolean
}

export function QuotationDetail({
  quotation,
  job,
  onRetryJob,
  isRetryingJob = false,
  onDownloadPdf,
  onDownloadExcel,
  isDownloadingPdf = false,
  isDownloadingExcel = false,
}: QuotationDetailProps) {
  const {
    quotationNumber,
    status,
    customerSnapshot,
    subtotal,
    discountAmount,
    taxRate,
    taxAmount,
    totalAmount,
    validUntil,
    deliveryAddress,
    paymentTerms,
    notes,
    templateVersion,
    items,
    createdAt,
  } = quotation

  const isCompleted =
    status === 'COMPLETED' || job?.status === 'COMPLETED'

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Card */}
      <Card className="shadow-xs border-primary/20 bg-muted/20">
        <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-lg sm:text-xl font-bold text-primary">
                {quotationNumber}
              </span>
              <StatusBadge status={status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                <span>Ngày tạo: </span>
                <DateText date={createdAt} withTime />
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                <span>Hiệu lực đến: </span>
                <DateText date={validUntil} />
              </span>
              <span>Phiên bản mẫu: {templateVersion}</span>
            </div>
          </div>

          <QuotationDownloadActions
            quotationId={quotation.id}
            quotationNumber={quotationNumber}
            isCompleted={isCompleted}
            onDownloadPdf={onDownloadPdf}
            onDownloadExcel={onDownloadExcel}
            isDownloadingPdf={isDownloadingPdf}
            isDownloadingExcel={isDownloadingExcel}
          />
        </CardContent>
      </Card>

      {/* Processing Job Progress Card */}
      <JobStatusCard
        job={job}
        onRetry={onRetryJob}
        isRetrying={isRetryingJob}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Customer Snapshot & Line items (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Snapshot */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    Thông tin khách hàng (Snapshot)
                  </CardTitle>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {customerSnapshot.code}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Tên khách hàng:</span>
                <span className="font-semibold text-foreground text-sm">
                  {customerSnapshot.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Công ty:</span>
                <span className="font-medium text-foreground">
                  {customerSnapshot.companyName || '—'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Email:</span>
                <span className="font-medium text-foreground">
                  {customerSnapshot.email || '—'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Số điện thoại:</span>
                <span className="font-medium font-mono text-foreground">
                  {customerSnapshot.phone || '—'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground block">Địa chỉ:</span>
                <span className="font-medium text-foreground">
                  {customerSnapshot.address || '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Line items table */}
          <Card className="shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Chi tiết các mặt hàng ({items.length})
                </CardTitle>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[120px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Mã SKU
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Tên sản phẩm & Quy cách
                    </TableHead>
                    <TableHead className="w-[80px] font-semibold text-xs text-muted-foreground uppercase tracking-wider text-center">
                      ĐVT
                    </TableHead>
                    <TableHead className="w-[90px] font-semibold text-xs text-muted-foreground uppercase tracking-wider text-right">
                      Số lượng
                    </TableHead>
                    <TableHead className="w-[130px] font-semibold text-xs text-muted-foreground uppercase tracking-wider text-right">
                      Đơn giá
                    </TableHead>
                    <TableHead className="w-[140px] font-semibold text-xs text-muted-foreground uppercase tracking-wider text-right">
                      Thành tiền
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {item.productSku}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground text-sm">
                          {item.productName}
                        </div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {item.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        <CurrencyText amount={item.unitPrice} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-foreground">
                        <CurrencyText amount={item.lineTotal} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Delivery & Terms Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Điều khoản giao nhận & Thanh toán
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block font-medium">Địa chỉ giao hàng:</span>
                  <span className="text-foreground">{deliveryAddress || 'Theo địa chỉ trụ sở khách hàng'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CreditCard className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block font-medium">Điều khoản thanh toán:</span>
                  <span className="text-foreground">{paymentTerms || 'Thanh toán tiêu chuẩn theo hợp đồng'}</span>
                </div>
              </div>

              {notes && (
                <div className="p-3 rounded bg-muted/40 border border-border/50 text-foreground">
                  <span className="text-muted-foreground block text-[11px] font-medium mb-1">Ghi chú kèm theo:</span>
                  <p className="whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Totals Summary Column (4 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-semibold">
                Tổng hợp giá trị chính thức
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Tổng tạm tính:</span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  <CurrencyText amount={subtotal} />
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Chiết khấu:</span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  - <CurrencyText amount={discountAmount} />
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Thuế GTGT ({taxRate}%):</span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  + <CurrencyText amount={taxAmount} />
                </span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="font-bold text-base text-foreground">Tổng cộng:</span>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-primary tabular-nums">
                    <CurrencyText amount={totalAmount} />
                  </div>
                  <div className="text-[11px] text-muted-foreground">Đã tính thuế VAT</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
