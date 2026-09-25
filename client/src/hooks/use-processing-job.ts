import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProcessingJob } from '@/api/processing-jobs-api'
import { queryKeys } from '@/lib/query-keys'
import type { ProcessingJob } from '@/types/processing-job'

interface UseProcessingJobOptions {
  enabled?: boolean
  onTerminal?: (job: ProcessingJob) => void
}

export function useProcessingJob(
  jobId?: string | null,
  options?: UseProcessingJobOptions
) {
  const queryClient = useQueryClient()
  const isEnabled = Boolean(jobId) && (options?.enabled ?? true)

  const query = useQuery({
    queryKey: queryKeys.processingJobs.detail(jobId ?? ''),
    queryFn: () => getProcessingJob(jobId!),
    enabled: isEnabled,
    refetchInterval: (q) => {
      const status = q.state.data?.data.status
      if (status === 'PENDING' || status === 'PROCESSING') {
        return 2000
      }
      return false
    },
  })

  const job = query.data?.data
  const terminalNotifiedRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!job) return

    const isTerminal = job.status === 'COMPLETED' || job.status === 'FAILED'
    const notificationKey = `${job.id}-${job.status}-${job.attemptCount}`

    if (isTerminal && terminalNotifiedRef.current !== notificationKey) {
      terminalNotifiedRef.current = notificationKey

      // Invalidate the related quotation detail to show updated file and status
      if (job.quotationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quotations.detail(job.quotationId),
        })
      }
      // Invalidate customer quotation history
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all,
      })

      options?.onTerminal?.(job)
    }
  }, [job, queryClient, options])

  return query
}
