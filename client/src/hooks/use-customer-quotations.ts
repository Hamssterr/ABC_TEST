import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCustomerQuotations } from '@/api/quotations-api'
import { queryKeys } from '@/lib/query-keys'
import type { PaginationParams } from '@/types/common'

export function useCustomerQuotations(
  customerId?: string,
  params?: PaginationParams
) {
  const queryParams = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
  }

  return useQuery({
    queryKey: queryKeys.customers.quotations(customerId ?? '', queryParams),
    queryFn: () => getCustomerQuotations(customerId!, queryParams),
    enabled: !!customerId,
    placeholderData: keepPreviousData,
  })
}
