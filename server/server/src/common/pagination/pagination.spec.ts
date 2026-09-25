import { describe, it, expect } from 'vitest';
import {
  calculatePaginationMeta,
  buildPaginatedResponse,
  getPaginationSkipTake,
} from './pagination.util.js';

describe('Pagination Utilities', () => {
  it('should calculate meta for first page correctly', () => {
    const meta = calculatePaginationMeta(25, 1, 10);
    expect(meta).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('should calculate meta for last page correctly', () => {
    const meta = calculatePaginationMeta(25, 3, 10);
    expect(meta).toEqual({
      page: 3,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('should calculate meta when total is 0', () => {
    const meta = calculatePaginationMeta(0, 1, 10);
    expect(meta).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it('should calculate meta when page exceeds totalPages', () => {
    const meta = calculatePaginationMeta(25, 5, 10);
    expect(meta).toEqual({
      page: 5,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('should build paginated response correctly', () => {
    const items = ['a', 'b'];
    const res = buildPaginatedResponse(items, 2, 1, 10);
    expect(res).toEqual({
      data: items,
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('should compute skip and take for page 1', () => {
    const { skip, take } = getPaginationSkipTake(1, 10);
    expect(skip).toBe(0);
    expect(take).toBe(10);
  });

  it('should compute skip and take for page 3', () => {
    const { skip, take } = getPaginationSkipTake(3, 15);
    expect(skip).toBe(30);
    expect(take).toBe(15);
  });

  it('should handle page < 1 safely', () => {
    const { skip, take } = getPaginationSkipTake(0, 10);
    expect(skip).toBe(0);
    expect(take).toBe(10);
  });

  it('should handle limit < 1 safely', () => {
    const { skip, take } = getPaginationSkipTake(1, 0);
    expect(skip).toBe(0);
    expect(take).toBe(10);
  });

  it('should calculate totalPages accurately for exact divisor', () => {
    const meta = calculatePaginationMeta(30, 2, 10);
    expect(meta.totalPages).toBe(3);
  });
});
