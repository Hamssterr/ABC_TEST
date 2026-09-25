import { describe, it, expect } from 'vitest'
import { normalizeError, isApiError } from '@/api/api-client'
import { AxiosError, AxiosHeaders } from 'axios'

describe('api-client error normalization', () => {
  it('correctly identifies ApiError using type guard', () => {
    expect(isApiError(null)).toBe(false)
    expect(isApiError(new Error('plain error'))).toBe(false)
    expect(
      isApiError({
        status: 400,
        message: 'Lỗi',
        kind: 'HTTP_ERROR',
      })
    ).toBe(true)
  })

  it('normalizes network error when response is missing', () => {
    const axiosError = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      undefined,
      undefined,
      undefined
    )

    const normalized = normalizeError(axiosError)
    expect(normalized.kind).toBe('NETWORK_ERROR')
    expect(normalized.status).toBe(0)
    expect(normalized.message).toContain('Không thể kết nối đến máy chủ')
  })

  it('normalizes timeout error', () => {
    const axiosError = new AxiosError(
      'timeout of 15000ms exceeded',
      'ECONNABORTED',
      undefined,
      undefined,
      undefined
    )

    const normalized = normalizeError(axiosError)
    expect(normalized.kind).toBe('TIMEOUT')
    expect(normalized.status).toBe(408)
    expect(normalized.message).toContain('quá thời gian chờ')
  })

  it('normalizes HTTP response errors from backend with validation messages', () => {
    const axiosError = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        data: {
          statusCode: 400,
          message: ['Tên khách hàng không được để trống', 'Email không hợp lệ'],
          error: 'Bad Request',
          path: '/api/customers',
          timestamp: '2026-09-24T00:00:00.000Z',
        },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    const normalized = normalizeError(axiosError)
    expect(normalized.kind).toBe('HTTP_ERROR')
    expect(normalized.status).toBe(400)
    expect(normalized.code).toBe('Bad Request')
    expect(normalized.validationErrors).toEqual([
      'Tên khách hàng không được để trống',
      'Email không hợp lệ',
    ])
    expect(normalized.message).toBe(
      'Tên khách hàng không được để trống, Email không hợp lệ'
    )
  })

  it('normalizes non-Axios error as UNKNOWN', () => {
    const normalized = normalizeError(new Error('Custom JavaScript error'))
    expect(normalized.kind).toBe('UNKNOWN')
    expect(normalized.status).toBe(500)
    expect(normalized.message).toBe('Custom JavaScript error')
  })
})
