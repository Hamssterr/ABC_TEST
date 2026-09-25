export interface ParsedPagination {
  page: number
  limit: number
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultPage = 1,
  defaultLimit = 10
): ParsedPagination {
  const rawPage = parseInt(searchParams.get('page') ?? '', 10)
  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10)

  return {
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : defaultPage,
    limit: Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit,
  }
}

export function buildPaginationSearchParams(page: number, limit: number): URLSearchParams {
  const params = new URLSearchParams()
  params.set('page', String(Math.max(1, page)))
  params.set('limit', String(Math.max(1, limit)))
  return params
}
