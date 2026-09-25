import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuotationDownloadActionsProps {
  quotationId: string
  quotationNumber?: string
  isCompleted: boolean
  onDownloadPdf: (quotationId: string) => Promise<void> | void
  onDownloadExcel: (quotationId: string, quotationNumber?: string) => Promise<void> | void
  isDownloadingPdf?: boolean
  isDownloadingExcel?: boolean
}

export function QuotationDownloadActions({
  quotationId,
  quotationNumber,
  isCompleted,
  onDownloadPdf,
  onDownloadExcel,
  isDownloadingPdf = false,
  isDownloadingExcel = false,
}: QuotationDownloadActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!isCompleted || isDownloadingPdf}
        onClick={() => onDownloadPdf(quotationId)}
        className="gap-1.5"
        title={
          !isCompleted
            ? 'Tệp PDF chỉ sẵn sàng khi tiến trình xử lý hoàn tất'
            : 'Tải báo giá định dạng PDF'
        }
      >
        {isDownloadingPdf ? (
          <Loader2 className="size-4 animate-spin text-primary" />
        ) : (
          <FileText className="size-4 text-rose-600" />
        )}
        <span>{isDownloadingPdf ? 'Đang tạo link PDF...' : 'Tải PDF'}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={isDownloadingExcel}
        onClick={() => onDownloadExcel(quotationId, quotationNumber)}
        className="gap-1.5"
        title="Xuất bảng tính báo giá ra file Excel"
      >
        {isDownloadingExcel ? (
          <Loader2 className="size-4 animate-spin text-emerald-600" />
        ) : (
          <FileSpreadsheet className="size-4 text-emerald-600" />
        )}
        <span>{isDownloadingExcel ? 'Đang xuất Excel...' : 'Xuất Excel'}</span>
      </Button>
    </div>
  )
}
