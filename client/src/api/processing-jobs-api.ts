import { apiClient } from './api-client'
import type { ApiResponse } from '@/types/api'
import type {
  ProcessingJob,
  RetryProcessingJobResponse,
} from '@/types/processing-job'

export async function getProcessingJob(
  jobId: string
): Promise<ApiResponse<ProcessingJob>> {
  const response = await apiClient.get<ApiResponse<ProcessingJob>>(
    `/processing-jobs/${jobId}`
  )
  return response.data
}

export async function retryProcessingJob(
  jobId: string
): Promise<ApiResponse<RetryProcessingJobResponse>> {
  const response = await apiClient.post<ApiResponse<RetryProcessingJobResponse>>(
    `/processing-jobs/${jobId}/retry`
  )
  return response.data
}
