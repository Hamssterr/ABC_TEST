import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { toDecimal } from '@/lib/decimal'
import { parsePaginationParams, buildPaginationSearchParams } from '@/lib/pagination'

describe('formatters', () => {
  it('formats currency according to vi-VN locale', () => {
    expect(formatCurrency(100000)).toMatch(/100\.000/)
    expect(formatCurrency(0)).toMatch(/0/)
    expect(formatCurrency(null)).toBe('0 ₫')
    expect(formatCurrency(undefined)).toBe('0 ₫')
    expect(formatCurrency('invalid')).toBe('0 ₫')
  })

  it('formats dates consistently', () => {
    expect(formatDate('2026-09-24T12:00:00Z')).toBe('24/09/2026')
    expect(formatDate(null)).toBe('—')
    expect(formatDate('invalid-date')).toBe('—')
    expect(formatDateTime('2026-09-24T12:30:00Z')).toContain('24/09/2026')
  })

  it('handles decimal normalization with Decimal.js', () => {
    expect(toDecimal('123.45').toNumber()).toBe(123.45)
    expect(toDecimal(null).toNumber()).toBe(0)
    expect(toDecimal('invalid').toNumber()).toBe(0)
    expect(toDecimal(50).plus(toDecimal(25)).toNumber()).toBe(75)
  })

  it('parses and builds URL pagination params', () => {
    const params = new URLSearchParams('page=2&limit=25')
    const parsed = parsePaginationParams(params)
    expect(parsed).toEqual({ page: 2, limit: 25 })

    const fallback = parsePaginationParams(new URLSearchParams('page=abc&limit=-5'))
    expect(fallback).toEqual({ page: 1, limit: 10 })

    const built = buildPaginationSearchParams(3, 20)
    expect(built.get('page')).toBe('3')
    expect(built.get('limit')).toBe('20')
  })
})
