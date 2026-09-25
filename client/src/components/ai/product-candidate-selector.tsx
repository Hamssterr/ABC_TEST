import { Check } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import type { ProductCandidate } from '@/types/ai'
import { cn } from '@/lib/utils'

interface ProductCandidateSelectorProps {
  candidates: ProductCandidate[]
  selectedCandidateId?: string
  onSelectCandidate: (candidate: ProductCandidate) => void
  disabled?: boolean
}

export function ProductCandidateSelector({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  disabled = false,
}: ProductCandidateSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
        AI tìm thấy {candidates.length} sản phẩm tương tự. Vui lòng chọn chính xác:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Danh sách sản phẩm gợi ý">
        {candidates.map((candidate) => {
          const isSelected = candidate.id === selectedCandidateId
          return (
            <button
              key={candidate.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelectCandidate(candidate)}
              className={cn(
                'flex items-start justify-between p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary-foreground font-medium ring-1 ring-primary'
                  : 'border-border/80 bg-background hover:border-primary/50 text-foreground',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="min-w-0 pr-2 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-muted text-foreground">
                    {candidate.sku}
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {candidate.name}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {formatCurrency(candidate.unitPrice)} / {candidate.unit}
                </div>
              </div>
              <div
                className={cn(
                  'size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                )}
              >
                {isSelected && <Check className="size-3" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
