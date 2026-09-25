import * as React from 'react'
import { toast } from 'sonner'
import { getQuotationDownload, exportQuotationExcel } from '@/api/quotations-api'
import { showErrorToast } from '@/lib/error-toast'

export function useQuotationDownload() {
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false)
  const [isDownloadingExcel, setIsDownloadingExcel] = React.useState(false)

  const downloadPdf = React.useCallback(async (quotationId: string) => {
    setIsDownloadingPdf(true)
    try {
      const response = await getQuotationDownload(quotationId)
      const { downloadUrl, fileName } = response.data

      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.download = fileName || 'quotation.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      toast.success('Đang mở/tải tệp PDF báo giá')
    } catch (error) {
      showErrorToast(error, {
        fallbackMessage: 'Không thể tạo liên kết tải file PDF. Vui lòng thử lại sau.',
      })
    } finally {
      setIsDownloadingPdf(false)
    }
  }, [])

  const downloadExcel = React.useCallback(
    async (quotationId: string, quotationNumber?: string) => {
      setIsDownloadingExcel(true)
      try {
        const { blob, fileName } = await exportQuotationExcel(quotationId)
        const objectUrl = URL.createObjectURL(blob)

        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download =
          fileName || `quotation-${quotationNumber || quotationId}.xlsx`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)

        setTimeout(() => {
          URL.revokeObjectURL(objectUrl)
        }, 1000)

        toast.success('Đã tải xuống bảng tính Excel')
      } catch (error) {
        showErrorToast(error, {
          fallbackMessage: 'Không thể xuất tệp Excel. Vui lòng thử lại sau.',
        })
      } finally {
        setIsDownloadingExcel(false)
      }
    },
    []
  )

  return {
    downloadPdf,
    downloadExcel,
    isDownloadingPdf,
    isDownloadingExcel,
  }
}
