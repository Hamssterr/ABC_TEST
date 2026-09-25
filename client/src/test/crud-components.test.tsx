import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CustomerTable } from '@/components/customers/customer-table'
import { ProductTable } from '@/components/products/product-table'
import type { Customer } from '@/types/customer'
import type { Product } from '@/types/product'

const mockCustomers: Customer[] = [
  {
    id: 'c1',
    code: 'CUS-001',
    name: 'Công ty Alpha',
    companyName: 'Alpha Corp',
    email: 'alpha@example.com',
    phone: '0901111111',
    address: 'Hà Nội',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
]

const mockProducts: Product[] = [
  {
    id: 'p1',
    sku: 'PROD-01',
    name: 'Cửa nhôm Xingfa',
    description: 'Hệ 55 cao cấp',
    unit: 'm²',
    unitPrice: '1850000.00',
    isActive: true,
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'p2',
    sku: 'PROD-02',
    name: 'Phụ kiện Kinlong',
    description: null,
    unit: 'bộ',
    unitPrice: '450000.00',
    isActive: false,
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
]

describe('CustomerTable', () => {
  it('renders customer row with code, name, and company', () => {
    render(
      <MemoryRouter>
        <CustomerTable
          customers={mockCustomers}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('CUS-001')).toBeInTheDocument()
    expect(screen.getByText('Công ty Alpha')).toBeInTheDocument()
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument()
  })
})

describe('ProductTable', () => {
  it('renders product rows with formatted price and active/inactive badges', () => {
    render(
      <MemoryRouter>
        <ProductTable
          products={mockProducts}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('PROD-01')).toBeInTheDocument()
    expect(screen.getByText('Cửa nhôm Xingfa')).toBeInTheDocument()
    expect(screen.getByText(/1\.850\.000/)).toBeInTheDocument()
    expect(screen.getByText('Đang bán')).toBeInTheDocument()
    expect(screen.getByText('Tạm ngưng')).toBeInTheDocument()
  })
})
