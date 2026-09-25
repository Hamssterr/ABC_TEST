import { useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { QuotationDetail } from '@/components/quotations/quotation-detail'
import { useQuotation } from '@/hooks/use-quotation'
import { useProcessingJob } from '@/hooks/use-processing-job'
import { useRetryProcessingJob } from '@/hooks/use-retry-processing-job'
import { useQuotationDownload } from '@/hooks/use-quotation-download'
import { showErrorToast } from '@/lib/error-toast'

export default function QuotationDetailPage() {
  const { quotationId } = useParams<{ quotationId: string }>()
  const location = useLocation()

  // 1. Fetch quotation detail
  const {
    data: quotationData,
    isLoading: isQuotationLoading,
    isError: isQuotationError,
    error: quotationError,
    refetch: refetchQuotation,
  } = useQuotation(quotationId)
  const quotation = quotationData?.data

  // 2. Resolve jobId from router state or quotation response
  const routerJobId = (location.state as { jobId?: string } | null)?.jobId
  const jobId = routerJobId || quotation?.processingJob?.id

  // 3. Poll processing job every 2s while in PENDING or PROCESSING status
  const {
    data: jobData,
    refetch: refetchJob,
  } = useProcessingJob(jobId)
  const job = jobData?.data ?? (quotation?.processingJob ? {
    id: quotation.processingJob.id,
    quotationId: quotation.id,
    status: quotation.processingJob.status,
    attemptCount: quotation.processingJob.attemptCount,
    maxAttempts: 3,
    errorMessage: quotation.processingJob.errorMessage,
    fileName: quotation.processingJob.fileName,
    completedAt: quotation.processingJob.completedAt,
  } : null)

  // 4. Retry mutation hook
  const retryMutation = useRetryProcessingJob()

  const handleRetry = async () => {
    if (!job?.id) return
    try {
      await retryMutation.mutateAsync(job.id)
      toast.success('Đã gửi yêu cầu thử lại tiến trình xử lý báo giá!')
      void refetchJob()
      void refetchQuotation()
    } catch (error) {
      showErrorToast(error, {
        fallbackMessage: 'Không thể thử lại tiến trình xử lý. Vui lòng kiểm tra lại trạng thái.',
      })
    }
  }

  // 5. Download hooks for PDF & Excel
  const {
    downloadPdf,
    downloadExcel,
    isDownloadingPdf,
    isDownloadingExcel,
  } = useQuotationDownload()

  if (isQuotationLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </PageContainer>
    )
  }

  if (isQuotationError || !quotation) {
    const is404 =
      typeof quotationError === 'object' &&
      quotationError !== null &&
      'status' in quotationError &&
      (quotationError as { status: number }).status === 404

    return (
      <PageContainer>
        <PageHeader
          title="Không tìm thấy báo giá"
          breadcrumbs={[
            { label: 'Khách hàng', href: '/customers' },
            { label: 'Chi tiết báo giá' },
          ]}
        />
        <ErrorState
          title={is404 ? 'Báo giá không tồn tại' : 'Lỗi khi tải chi tiết báo giá'}
          message={
            is404
              ? `Không tìm thấy thông tin báo giá với mã "${quotationId}". Có thể bản ghi không tồn tại.`
              : 'Đã xảy ra lỗi khi tải dữ liệu từ máy chủ.'
          }
          onRetry={is404 ? undefined : () => void refetchQuotation()}
        />
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link to="/customers" className="gap-2">
              <ArrowLeft className="size-4" />
              <span>Quay lại danh sách khách hàng</span>
            </Link>
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Báo giá: ${quotation.quotationNumber}`}
        description={`Khách hàng: ${quotation.customerSnapshot.name} (${quotation.customerSnapshot.code})`}
        breadcrumbs={[
          { label: 'Khách hàng', href: '/customers' },
          {
            label: quotation.customerSnapshot.code,
            href: `/customers/${quotation.customerId}`,
          },
          { label: quotation.quotationNumber },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/customers/${quotation.customerId}`} className="gap-1.5">
                <ArrowLeft className="size-4" />
                <span>Hồ sơ khách hàng</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetchQuotation()
                if (jobId) void refetchJob()
              }}
              className="gap-1.5"
            >
              <RefreshCw className="size-4" />
              <span>Làm mới</span>
            </Button>
          </div>
        }
      />

      <QuotationDetail
        quotation={quotation}
        job={job}
        onRetryJob={handleRetry}
        isRetryingJob={retryMutation.isPending}
        onDownloadPdf={downloadPdf}
        onDownloadExcel={downloadExcel}
        isDownloadingPdf={isDownloadingPdf}
        isDownloadingExcel={isDownloadingExcel}
      />
    </PageContainer>
  )
}
