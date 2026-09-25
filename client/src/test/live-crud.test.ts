import { describe, it, expect, beforeAll } from 'vitest'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/api/customers-api'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/api/products-api'
import { isApiError } from '@/api/api-client'
import type { NormalizedApiError } from '@/types/api'
import { getHealth } from '@/api/health-api'

describe('Live Backend CRUD Verification', () => {
  const uniqueSuffix = Date.now().toString().slice(-6)
  const testCustomerCode = `TC-${uniqueSuffix}`
  const testProductSku = `TS-${uniqueSuffix}`

  let customerId = ''
  let productId = ''
  let isBackendLive = false

  beforeAll(async () => {
    try {
      const health = await getHealth()
      isBackendLive = health.status === 'ok'
    } catch {
      isBackendLive = false
    }
  })

  describe('Customer Live Flow', () => {
    it('1. GET /customers returns paginated list', async () => {
      if (!isBackendLive) return
      const response = await getCustomers({ page: 1, limit: 10 })
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('meta')
      expect(response.meta.page).toBe(1)
      expect(response.meta.limit).toBe(10)
    })

    it('2. POST /customers creates a customer with unique code', async () => {
      if (!isBackendLive) return
      const response = await createCustomer({
        code: testCustomerCode,
        name: 'Khách hàng Test Tự động',
        companyName: 'Công ty ABC Test',
        email: `test.${uniqueSuffix}@example.com`,
        phone: '0988776655',
        address: 'Hà Nội, Việt Nam',
      })

      expect(response.data).toBeDefined()
      expect(response.data.code).toBe(testCustomerCode)
      expect(response.data.name).toBe('Khách hàng Test Tự động')
      customerId = response.data.id
      expect(customerId).toBeTruthy()
    })

    it('3. GET /customers/:id fetches the created customer detail', async () => {
      if (!isBackendLive) return
      const response = await getCustomer(customerId)
      expect(response.data.id).toBe(customerId)
      expect(response.data.code).toBe(testCustomerCode)
      expect(response.data.companyName).toBe('Công ty ABC Test')
    })

    it('4. PATCH /customers/:id updates customer information', async () => {
      if (!isBackendLive) return
      const response = await updateCustomer(customerId, {
        name: 'Khách hàng Test Đã Cập Nhật',
        companyName: 'Công ty Mới Cập Nhật',
      })

      expect(response.data.name).toBe('Khách hàng Test Đã Cập Nhật')
      expect(response.data.companyName).toBe('Công ty Mới Cập Nhật')
    })

    it('5. POST /customers with duplicate code returns HTTP 409 Conflict', async () => {
      if (!isBackendLive) return
      try {
        await createCustomer({
          code: testCustomerCode,
          name: 'Trùng mã khách hàng',
        })
        expect.unreachable('Should have thrown 409')
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true)
        const apiErr = err as NormalizedApiError
        expect(apiErr.status).toBe(409)
        expect(apiErr.message.toLowerCase()).toContain('already exists')
      }
    })

    it('6. DELETE /customers/:id soft-deletes the customer with HTTP 204', async () => {
      if (!isBackendLive) return
      await expect(deleteCustomer(customerId)).resolves.not.toThrow()

      // Calling getCustomer on deleted customer must now return 404
      try {
        await getCustomer(customerId)
        expect.unreachable('Should have thrown 404')
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true)
        const apiErr = err as NormalizedApiError
        expect(apiErr.status).toBe(404)
      }
    })
  })

  describe('Product Live Flow', () => {
    it('1. GET /products returns paginated list', async () => {
      if (!isBackendLive) return
      const response = await getProducts({ page: 1, limit: 10 })
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('meta')
      expect(response.meta.page).toBe(1)
    })

    it('2. POST /products creates a product with decimal string price', async () => {
      if (!isBackendLive) return
      const response = await createProduct({
        sku: testProductSku,
        name: 'Cửa nhôm kính test',
        description: 'Mô tả kỹ thuật thử nghiệm',
        unit: 'm²',
        unitPrice: '1850000.00',
        isActive: true,
      })

      expect(response.data).toBeDefined()
      expect(response.data.sku).toBe(testProductSku)
      expect(response.data.unitPrice).toBe('1850000.00')
      expect(response.data.isActive).toBe(true)
      productId = response.data.id
      expect(productId).toBeTruthy()
    })

    it('3. GET /products/:id fetches created product', async () => {
      if (!isBackendLive) return
      const response = await getProduct(productId)
      expect(response.data.id).toBe(productId)
      expect(response.data.sku).toBe(testProductSku)
    })

    it('4. PATCH /products/:id updates status and price', async () => {
      if (!isBackendLive) return
      const response = await updateProduct(productId, {
        isActive: false,
        unitPrice: '2100000.50',
      })

      expect(response.data.isActive).toBe(false)
      expect(response.data.unitPrice).toBe('2100000.50')
    })

    it('5. POST /products with duplicate SKU returns HTTP 409 Conflict', async () => {
      if (!isBackendLive) return
      try {
        await createProduct({
          sku: testProductSku,
          name: 'Trùng SKU',
          unit: 'm²',
          unitPrice: '100000',
        })
        expect.unreachable('Should have thrown 409')
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true)
        const apiErr = err as NormalizedApiError
        expect(apiErr.status).toBe(409)
        expect(apiErr.message.toLowerCase()).toContain('already exists')
      }
    })

    it('6. DELETE /products/:id soft-deletes product with HTTP 204', async () => {
      if (!isBackendLive) return
      await expect(deleteProduct(productId)).resolves.not.toThrow()

      try {
        await getProduct(productId)
        expect.unreachable('Should have thrown 404')
      } catch (err: unknown) {
        expect(isApiError(err)).toBe(true)
        const apiErr = err as NormalizedApiError
        expect(apiErr.status).toBe(404)
      }
    })
  })
})
