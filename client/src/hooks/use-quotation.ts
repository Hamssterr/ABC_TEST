import { useQuery } from '@tanstack/react-query'
import { getQuotation } from '@/api/quotations-api'
import { queryKeys } from '@/lib/query-keys'

export function useQuotation(quotationId?: string) {
  return useQuery({
    queryKey: queryKeys.quotations.detail(quotationId ?? ''),
    queryFn: () => getQuotation(quotationId!),
    enabled: !!quotationId,
  })
}
