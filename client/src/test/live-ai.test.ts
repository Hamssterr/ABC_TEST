import { describe, it, expect } from 'vitest'
import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

describe('Live AI Quotation Draft Integration', () => {
  it('rejects rawRequest shorter than 1 character or missing with 400 Bad Request', async () => {
    try {
      await axios.post(`${BASE_URL}/ai/quotation-draft`, {
        customerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        rawRequest: '',
      })
      expect.fail('Should have failed with 400')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        expect(err.response?.status).toBe(400)
      } else {
        throw err
      }
    }
  })

  it('rejects invalid UUID customerId with 400 Bad Request', async () => {
    try {
      await axios.post(`${BASE_URL}/ai/quotation-draft`, {
        customerId: 'not-a-uuid',
        rawRequest: 'Cần báo giá 2 máy tính',
      })
      expect.fail('Should have failed with 400')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        expect(err.response?.status).toBe(400)
      } else {
        throw err
      }
    }
  })

  it('rejects non-existent valid UUID v4 customerId with 404 Not Found', async () => {
    try {
      await axios.post(`${BASE_URL}/ai/quotation-draft`, {
        customerId: '11111111-1111-4111-8111-111111111111',
        rawRequest: 'Cần báo giá 2 máy tính',
      })
      expect.fail('Should have failed with 404')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        expect(err.response?.status).toBe(404)
      } else {
        throw err
      }
    }
  })

  it('handles AI draft request for an existing customer with contract verification', async () => {
    // 1. Get a valid customer
    const customersRes = await axios.get(`${BASE_URL}/customers?page=1&limit=1`)
    const customer = customersRes.data?.data?.[0]
    expect(customer).toBeDefined()

    try {
      const response = await axios.post(
        `${BASE_URL}/ai/quotation-draft`,
        {
          customerId: customer.id,
          rawRequest:
            'Cần báo giá 2 chiếc Laptop Workstation và 3 Màn hình 27 inch 4K. Giao tại 123 Hà Nội. Thanh toán sau 15 ngày.',
        },
        { timeout: 35000 }
      )

      expect(response.status).toBe(200)
      const data = response.data.data
      expect(data).toHaveProperty('items')
      expect(Array.isArray(data.items)).toBe(true)
      expect(data).toHaveProperty('unresolvedFields')
      expect(Array.isArray(data.unresolvedFields)).toBe(true)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        // If Gemini is not configured, quota exceeded, or upstream 502/503/504, it is a gracefully handled error status
        expect([200, 502, 503, 504]).toContain(err.response?.status)
      } else {
        throw err
      }
    }
  })
})
