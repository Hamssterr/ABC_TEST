import * as React from 'react'
import {
  CheckCircle2,
  Sparkles,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UnresolvedFieldsAlert } from './unresolved-fields-alert'
import { ProductCandidateSelector } from './product-candidate-selector'
import { convertValidityDaysToDate } from '@/schemas/ai-quotation-schema'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { QuotationDraft, ProductCandidate } from '@/types/ai'

interface AiDraftSummaryProps {
  draft: QuotationDraft
  selectedCandidateIds: Record<number, string>
  onSelectCandidate: (itemIndex: number, candidate: ProductCandidate) => void
  onApply: () => void
  onReset: () => void
}

export function AiDraftSummary({
  draft,
  selectedCandidateIds,
  onSelectCandidate,
  onApply,
  onReset,
}: AiDraftSummaryProps) {
  // Check if any item with multiple candidates has not been selected yet
  const hasUnselectedMultipleCandidates = draft.items.some((item, index) => {
    return item.candidates.length > 1 && !selectedCandidateIds[index]
  })

  const convertedValidUntil = React.useMemo(() => {
    return convertValidityDaysToDate(draft.validityDays)
  }, [draft.validityDays])

  return (
    <Card className="border-primary/40 bg-card shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Bản nháp AI đã trích xuất
              </CardTitle>
              <CardDescription className="text-xs">
                Xem lại các thông tin bên dưới và nhấn &ldquo;Áp dụng vào biểu mẫu&rdquo; để hoàn thiện.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto bg-primary/5 text-primary border-primary/20">
            {draft.items.length} dòng sản phẩm
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Unresolved fields alert */}
        <UnresolvedFieldsAlert unresolvedFields={draft.unresolvedFields} />

        {/* Extracted items */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Danh sách sản phẩm được AI nhận diện
          </div>

          <div className="space-y-2.5">
            {draft.items.map((item, index) => {
              const hasSingleCandidate = item.candidates.length === 1
              const hasMultipleCandidates = item.candidates.length > 1
              const hasNoCandidate = item.candidates.length === 0
              const singleCandidate = hasSingleCandidate ? item.candidates[0] : null
              const selectedCandidateId = selectedCandidateIds[index]
              const currentSelectedCandidate = item.candidates.find(
                (c) => c.id === selectedCandidateId
              )

              return (
                <div
                  key={index}
                  className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-2.5 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-foreground text-sm">
                        &ldquo;{item.productQuery}&rdquo;
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Số lượng:</span>
                      {item.quantity ? (
                        <span className="font-mono font-semibold text-foreground px-2 py-0.5 rounded bg-background border">
                          {item.quantity}
                        </span>
                      ) : (
                        <Badge variant="destructive" className="text-[11px]">
                          Chưa có số lượng
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Candidate Status Display */}
                  {hasSingleCandidate && singleCandidate && (
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-background border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          Khớp tự động: <strong className="font-semibold">{singleCandidate.name}</strong> ({singleCandidate.sku})
                        </span>
                      </div>
                      <span className="font-mono font-medium">
                        {formatCurrency(singleCandidate.unitPrice)} / {singleCandidate.unit}
                      </span>
                    </div>
                  )}

                  {hasMultipleCandidates && (
                    <div className="pt-1">
                      <ProductCandidateSelector
                        candidates={item.candidates}
                        selectedCandidateId={selectedCandidateId}
                        onSelectCandidate={(candidate) =>
                          onSelectCandidate(index, candidate)
                        }
                      />
                      {currentSelectedCandidate && (
                        <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1.5">
                          <Check className="size-3.5" />
                          <span>
                            Đã chọn: {currentSelectedCandidate.name} ({currentSelectedCandidate.sku})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {hasNoCandidate && (
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                      <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        Không tìm thấy sản phẩm trong kho phù hợp với từ khóa này. Dòng này sẽ được thêm vào biểu mẫu để bạn tự chọn thủ công.
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Extracted Quotation Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-lg border border-border/60 bg-muted/10 text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block font-medium">
                Địa chỉ giao hàng nhận diện:
              </span>
              <span className="text-foreground font-medium">
                {draft.deliveryAddress || 'Không có (giữ nguyên địa chỉ khách hàng)'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CreditCard className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block font-medium">
                Điều khoản thanh toán nhận diện:
              </span>
              <span className="text-foreground font-medium">
                {draft.paymentTerms || 'Không có (giữ nguyên mặc định)'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block font-medium">
                Thời hạn hiệu lực nhận diện:
              </span>
              <span className="text-foreground font-medium">
                {draft.validityDays
                  ? `${draft.validityDays} ngày (đến ngày ${formatDate(convertedValidUntil)})`
                  : 'Không có (giữ nguyên mặc định 30 ngày)'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground block font-medium">
                Ghi chú nhận diện:
              </span>
              <span className="text-foreground font-medium">
                {draft.notes || 'Không có ghi chú'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full sm:w-auto gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            <span>Phân tích yêu cầu khác</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="default"
            onClick={onApply}
            disabled={hasUnselectedMultipleCandidates}
            className="w-full sm:w-auto gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Check className="size-4" />
            <span>Áp dụng vào biểu mẫu bên dưới</span>
          </Button>
        </div>

        {hasUnselectedMultipleCandidates && (
          <p className="text-center sm:text-right text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            * Vui lòng chọn sản phẩm phù hợp cho các dòng có nhiều gợi ý trước khi áp dụng.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
