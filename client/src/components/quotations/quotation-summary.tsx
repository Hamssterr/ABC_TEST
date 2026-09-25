import React from 'react'
import { Calculator, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyText } from '@/components/shared/currency-text'
import type { QuotationPreviewCalculation } from '@/schemas/quotation-schema'

interface QuotationSummaryProps {
  calculation: QuotationPreviewCalculation
  actionsSlot?: React.ReactNode
  className?: string
}

export function QuotationSummary({
  calculation,
  actionsSlot,
  className,
}: QuotationSummaryProps) {
  const {
    subtotal,
    discountAmount,
    taxRate,
    taxAmount,
    totalAmount,
    isDiscountExceeded,
  } = calculation

  return (
    <Card className={`shadow-xs border-border/80 ${className ?? ''}`}>
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-primary" />
          <CardTitle className="text-base font-semibold">Tóm tắt giá trị báo giá</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 text-sm">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Tổng tạm tính:</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            <CurrencyText amount={subtotal} />
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Chiết khấu giảm giá:</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            - <CurrencyText amount={discountAmount} />
          </span>
        </div>

        {isDiscountExceeded && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>Tiền chiết khấu không được vượt quá tổng tạm tính.</span>
          </div>
        )}

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Thuế VAT ({taxRate}%):</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            + <CurrencyText amount={taxAmount} />
          </span>
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-baseline">
          <span className="font-bold text-base text-foreground">Tổng thanh toán:</span>
          <div className="text-right">
            <div className="text-xl font-bold font-mono text-primary tabular-nums">
              <CurrencyText amount={totalAmount} />
            </div>
            <div className="text-[11px] text-muted-foreground">Đã bao gồm thuế GTGT</div>
          </div>
        </div>

        <div className="p-2.5 rounded bg-muted/60 text-[11px] text-muted-foreground flex items-start gap-2">
          <Info className="size-3.5 shrink-0 mt-0.5 text-primary" />
          <span>
            Bảng tạm tính giúp kiểm tra nhanh số liệu. Đơn giá và tổng tiền chính thức sẽ do máy chủ xác lập sau khi gửi.
          </span>
        </div>

        {actionsSlot && <div className="pt-2">{actionsSlot}</div>}
      </CardContent>
    </Card>
  )
}
