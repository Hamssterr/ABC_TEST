import { useMutation, useQueryClient } from '@tanstack/react-query'
import { retryProcessingJob } from '@/api/processing-jobs-api'
import { queryKeys } from '@/lib/query-keys'

export function useRetryProcessingJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => retryProcessingJob(jobId),
    onSuccess: (data) => {
      const { jobId, quotationId } = data.data
      queryClient.invalidateQueries({
        queryKey: queryKeys.processingJobs.detail(jobId),
      })
      if (quotationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quotations.detail(quotationId),
        })
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all,
      })
    },
  })
}
