import { describe, it, expect } from 'vitest'
import {
  productSchema,
  toCreateProductPayload,
  toUpdateProductPayload,
} from '@/schemas/product-schema'

describe('productSchema & payloads', () => {
  it('validates a valid product form values', () => {
    const valid = {
      sku: 'nhom-xf-01',
      name: 'Cửa nhôm Xingfa',
      description: 'Hệ 55, kính cường lực 8mm',
      unit: 'm²',
      unitPrice: '1850000',
      isActive: true,
    }

    const result = productSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('fails when unitPrice is negative or invalid decimal', () => {
    expect(
      productSchema.safeParse({
        sku: 'SKU1',
        name: 'P1',
        unit: 'm²',
        unitPrice: '-500',
        isActive: true,
      }).success
    ).toBe(false)

    expect(
      productSchema.safeParse({
        sku: 'SKU1',
        name: 'P1',
        unit: 'm²',
        unitPrice: '1500.999', // more than 2 decimal places
        isActive: true,
      }).success
    ).toBe(false)

    expect(
      productSchema.safeParse({
        sku: 'SKU1',
        name: 'P1',
        unit: 'm²',
        unitPrice: 'abc',
        isActive: true,
      }).success
    ).toBe(false)
  })

  it('normalizes price to 2 decimal places via Decimal.js in payload', () => {
    const createPayload = toCreateProductPayload({
      sku: '  sku-abc  ',
      name: '  Sản phẩm 1  ',
      description: '',
      unit: '  cái  ',
      unitPrice: '1500000',
      isActive: true,
    })

    expect(createPayload.sku).toBe('SKU-ABC')
    expect(createPayload.name).toBe('Sản phẩm 1')
    expect(createPayload.description).toBeNull()
    expect(createPayload.unit).toBe('cái')
    expect(createPayload.unitPrice).toBe('1500000.00')

    const updatePayload = toUpdateProductPayload({
      sku: 'sku-abc',
      name: 'Sản phẩm 1',
      description: 'Mô tả mới',
      unit: 'bộ',
      unitPrice: '1250000.5',
      isActive: false,
    })

    expect(updatePayload.unitPrice).toBe('1250000.50')
    expect(updatePayload.isActive).toBe(false)
  })
})
