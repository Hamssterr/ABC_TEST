import { describe, it, expect } from 'vitest'
import { validateEnv } from '@/config/env'

describe('validateEnv', () => {
  it('parses valid environment with VITE_API_BASE_URL', () => {
    const raw = { VITE_API_BASE_URL: 'http://localhost:3000/api' }
    const result = validateEnv(raw)
    expect(result.apiBaseUrl).toBe('http://localhost:3000/api')
  })

  it('strips trailing slashes from apiBaseUrl', () => {
    const raw = { VITE_API_BASE_URL: 'http://localhost:3000/api///' }
    const result = validateEnv(raw)
    expect(result.apiBaseUrl).toBe('http://localhost:3000/api')
  })

  it('throws error when VITE_API_BASE_URL is missing or empty', () => {
    expect(() => validateEnv({})).toThrow(/Cấu hình môi trường không hợp lệ/)
    expect(() => validateEnv({ VITE_API_BASE_URL: '' })).toThrow(/Cấu hình môi trường không hợp lệ/)
  })

  it('throws error when VITE_API_BASE_URL is not a valid URL', () => {
    expect(() => validateEnv({ VITE_API_BASE_URL: 'not-a-valid-url' })).toThrow(/Cấu hình môi trường không hợp lệ/)
  })
})
