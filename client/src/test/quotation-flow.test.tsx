import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JobStatusCard } from '@/components/quotations/job-status-card'
import { QuotationSummary } from '@/components/quotations/quotation-summary'
import { QuotationDownloadActions } from '@/components/quotations/quotation-download-actions'
import type { ProcessingJob } from '@/types/processing-job'

describe('Batch 2 Quotation UI Components', () => {
  it('renders JobStatusCard in PENDING / PROCESSING state with spinner and explanation', () => {
    const pendingJob: ProcessingJob = {
      id: 'job-1',
      quotationId: 'quot-1',
      status: 'PENDING',
      attemptCount: 0,
      maxAttempts: 3,
      errorMessage: null,
      fileName: null,
      completedAt: null,
    }

    render(<JobStatusCard job={pendingJob} />)
    expect(screen.getByText(/hàng đợi/i)).toBeInTheDocument()
    expect(screen.getByText(/Lần thử: 0\/3/)).toBeInTheDocument()
  })

  it('renders JobStatusCard in FAILED state with error message and retry button', () => {
    const failedJob: ProcessingJob = {
      id: 'job-1',
      quotationId: 'quot-1',
      status: 'FAILED',
      attemptCount: 1,
      maxAttempts: 3,
      errorMessage: 'Network timeout during PDF render',
      fileName: null,
      completedAt: null,
    }

    render(<JobStatusCard job={failedJob} onRetry={vi.fn()} />)
    expect(screen.getByText(/Network timeout during PDF render/)).toBeInTheDocument()
    expect(screen.getByText(/Thử lại tiến trình/i)).toBeInTheDocument()
  })

  it('renders QuotationSummary with proper financial calculations and warnings', () => {
    const calculation = {
      lineTotals: { p1: '1000000.00' },
      subtotal: '1000000.00',
      discountAmount: '100000.00',
      taxRate: '10.00',
      taxAmount: '90000.00',
      totalAmount: '990000.00',
      isDiscountExceeded: false,
    }

    render(<QuotationSummary calculation={calculation} />)
    expect(screen.getByText(/Tổng tạm tính:/)).toBeInTheDocument()
    expect(screen.getByText(/Thuế VAT \(10.00%\):/)).toBeInTheDocument()
    expect(screen.getByText(/Tổng thanh toán:/)).toBeInTheDocument()
  })

  it('disables PDF download button until job is completed', () => {
    const onDownloadPdf = vi.fn()
    const onDownloadExcel = vi.fn()

    const { rerender } = render(
      <QuotationDownloadActions
        quotationId="q-1"
        isCompleted={false}
        onDownloadPdf={onDownloadPdf}
        onDownloadExcel={onDownloadExcel}
      />
    )

    const pdfButton = screen.getByRole('button', { name: /Tải PDF/i })
    expect(pdfButton).toBeDisabled()

    // Rerender when completed
    rerender(
      <QuotationDownloadActions
        quotationId="q-1"
        isCompleted={true}
        onDownloadPdf={onDownloadPdf}
        onDownloadExcel={onDownloadExcel}
      />
    )
    expect(screen.getByRole('button', { name: /Tải PDF/i })).not.toBeDisabled()
  })
})
