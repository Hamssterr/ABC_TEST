import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DesktopSidebar } from '@/components/layout/desktop-sidebar'
import { StatusBadge } from '@/components/shared/status-badge'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { QuotationJobStatus } from '@/types/common'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: React.ReactElement, initialRoute = '/customers') {
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          {ui}
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

describe('DesktopSidebar', () => {
  it('renders navigation items for Customers and Products with active state', () => {
    renderWithProviders(<DesktopSidebar />, '/customers')

    const customerLink = screen.getByRole('link', { name: /khách hàng/i })
    const productLink = screen.getByRole('link', { name: /sản phẩm/i })

    expect(customerLink).toBeInTheDocument()
    expect(productLink).toBeInTheDocument()
    expect(customerLink).toHaveAttribute('aria-current', 'page')
    expect(productLink).not.toHaveAttribute('aria-current')
  })

  it('does NOT contain quotation list in sidebar navigation', () => {
    renderWithProviders(<DesktopSidebar />, '/customers')
    const links = screen.getAllByRole('link')
    const quotationLink = links.find((link) => link.textContent?.includes('Báo giá'))
    // "Báo giá" is only in subtitle "Hệ thống Báo giá", never in navigation items
    expect(quotationLink).toBeUndefined()
  })
})

describe('StatusBadge', () => {
  const cases: Array<{ status: QuotationJobStatus; expectedText: string }> = [
    { status: 'SUBMITTED', expectedText: 'Đã gửi' },
    { status: 'PENDING', expectedText: 'Đang chờ' },
    { status: 'PROCESSING', expectedText: 'Đang xử lý' },
    { status: 'COMPLETED', expectedText: 'Hoàn thành' },
    { status: 'FAILED', expectedText: 'Thất bại' },
  ]

  it.each(cases)('renders text and styling for status $status', ({ status, expectedText }) => {
    render(<StatusBadge status={status} />)
    const badge = screen.getByText(expectedText)
    expect(badge).toBeInTheDocument()
  })
})
