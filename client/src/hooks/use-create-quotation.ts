import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createQuotation } from '@/api/quotations-api'
import { queryKeys } from '@/lib/query-keys'
import type { CreateQuotationInput } from '@/types/quotation'

export function useCreateQuotation(customerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateQuotationInput) => createQuotation(customerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.quotations(customerId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.all,
      })
    },
  })
}
