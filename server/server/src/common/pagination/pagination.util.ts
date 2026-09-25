import { PaginationMeta } from './pagination-meta.interface.js';
import { PaginatedResponse } from './paginated-response.interface.js';

export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: calculatePaginationMeta(total, page, limit),
  };
}

export function getPaginationSkipTake(
  page: number,
  limit: number,
): { skip: number; take: number } {
  const safePage = page >= 1 ? page : 1;
  const safeLimit = limit >= 1 ? limit : 10;
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}
