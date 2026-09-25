export type ProcessingJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'

export interface ProcessingJob {
  id: string
  quotationId: string
  status: ProcessingJobStatus
  attemptCount: number
  maxAttempts: number
  errorMessage: string | null
  fileName: string | null
  completedAt: string | null
}

export interface RetryProcessingJobResponse {
  jobId: string
  quotationId: string
  status: ProcessingJobStatus
  attemptCount: number
  maxAttempts: number
}
