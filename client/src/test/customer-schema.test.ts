import { describe, it, expect } from 'vitest'
import {
  customerSchema,
  toCreateCustomerPayload,
  toUpdateCustomerPayload,
} from '@/schemas/customer-schema'

describe('customerSchema & payloads', () => {
  it('validates a valid customer form values', () => {
    const valid = {
      code: 'cus-001',
      name: 'Công ty Test',
      companyName: 'Test Corp',
      email: 'test@example.com',
      phone: '0988888888',
      address: 'Hà Nội',
    }

    const result = customerSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('fails when code or name is missing', () => {
    const invalid = {
      code: '',
      name: '',
    }
    const result = customerSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('code'))).toBe(true)
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
    }
  })

  it('allows empty email but rejects invalid email format', () => {
    expect(customerSchema.safeParse({ code: 'C1', name: 'N1', email: '' }).success).toBe(true)
    expect(customerSchema.safeParse({ code: 'C1', name: 'N1', email: 'invalid-email' }).success).toBe(false)
  })

  it('transforms create payload with uppercase code and null for empty optionals', () => {
    const payload = toCreateCustomerPayload({
      code: ' cus-test ',
      name: ' Nguyễn Văn A ',
      companyName: '',
      email: ' Test@Email.Com ',
      phone: '',
      address: '   ',
    })

    expect(payload.code).toBe('CUS-TEST')
    expect(payload.name).toBe('Nguyễn Văn A')
    expect(payload.companyName).toBeNull()
    expect(payload.email).toBe('test@email.com')
    expect(payload.phone).toBeNull()
    expect(payload.address).toBeNull()
  })

  it('transforms update payload sending null for cleared optional fields', () => {
    const payload = toUpdateCustomerPayload({
      code: 'cus-002',
      name: 'Tên Mới',
      companyName: '',
      email: '',
      phone: '',
      address: '',
    })

    expect(payload.companyName).toBeNull()
    expect(payload.email).toBeNull()
    expect(payload.phone).toBeNull()
    expect(payload.address).toBeNull()
  })
})
