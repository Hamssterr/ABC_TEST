import * as React from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  FileText,
  Sparkles,
  History,
  Plus,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { TablePagination } from '@/components/shared/table-pagination'
import { DateText } from '@/components/shared/date-text'
import { CustomerFormSheet } from '@/components/customers/customer-form-sheet'
import { QuotationHistoryTable } from '@/components/quotations/quotation-history-table'
import { QuotationHistoryCardList } from '@/components/quotations/quotation-history-card-list'
import { useCustomer } from '@/hooks/use-customers'
import { useCustomerQuotations } from '@/hooks/use-customer-quotations'

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.max(1, Number(searchParams.get('limit') || '10'))

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(newPage))
      return next
    })
  }

  // 1. Fetch customer profile
  const {
    data: customerData,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
    error: customerError,
    refetch: refetchCustomer,
  } = useCustomer(customerId)
  const customer = customerData?.data

  // 2. Fetch customer quotation history
  const {
    data: quotationsData,
    isLoading: isQuotationsLoading,
    isError: isQuotationsError,
    refetch: refetchQuotations,
  } = useCustomerQuotations(customerId, { page, limit })

  if (isCustomerLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </PageContainer>
    )
  }

  if (isCustomerError || !customer) {
    const is404 =
      typeof customerError === 'object' &&
      customerError !== null &&
      'status' in customerError &&
      (customerError as { status: number }).status === 404

    return (
      <PageContainer>
        <PageHeader
          title="Không tìm thấy khách hàng"
          breadcrumbs={[
            { label: 'Khách hàng', href: '/customers' },
            { label: 'Chi tiết' },
          ]}
        />
        <ErrorState
          title={is404 ? 'Hồ sơ khách hàng không tồn tại' : 'Lỗi khi tải thông tin khách hàng'}
          message={
            is404
              ? `Không tìm thấy khách hàng với mã định danh "${customerId}". Hồ sơ có thể đã bị xóa hoặc không hợp lệ.`
              : 'Đã xảy ra lỗi khi tải dữ liệu từ máy chủ.'
          }
          onRetry={is404 ? undefined : () => void refetchCustomer()}
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

  const quotations = quotationsData?.data ?? []
  const meta = quotationsData?.meta

  return (
    <PageContainer>
      <PageHeader
        title={customer.name}
        description={`Mã khách hàng: ${customer.code}`}
        breadcrumbs={[
          { label: 'Khách hàng', href: '/customers' },
          { label: customer.code },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild size="sm">
              <Link to="/customers" className="gap-1.5">
                <ArrowLeft className="size-4" />
                <span>Danh sách</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="gap-1.5"
            >
              <Pencil className="size-4" />
              <span>Chỉnh sửa</span>
            </Button>
            <Button variant="secondary" asChild size="sm">
              <Link
                to={`/customers/${customer.id}/quotations/new?mode=manual`}
                className="gap-1.5"
              >
                <FileText className="size-4" />
                <span>Tạo báo giá</span>
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link
                to={`/customers/${customer.id}/quotations/new?mode=ai`}
                className="gap-1.5"
              >
                <Sparkles className="size-4" />
                <span>Báo giá với AI</span>
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Customer Overview Card */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-primary/10 text-primary">
                  {customer.code}
                </span>
                <CardTitle className="text-xl font-bold mt-2">
                  {customer.name}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border border-border/50">
                <Building2 className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Tên công ty</div>
                  <div className="font-medium text-foreground">{customer.companyName || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border border-border/50">
                <Mail className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Email liên hệ</div>
                  <div className="font-medium text-foreground">{customer.email || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border border-border/50">
                <Phone className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Số điện thoại</div>
                  <div className="font-medium font-mono text-foreground">{customer.phone || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border border-border/50 md:col-span-2">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Địa chỉ</div>
                  <div className="font-medium text-foreground">{customer.address || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border border-border/50">
                <Calendar className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Ngày tạo hồ sơ</div>
                  <div className="font-medium text-foreground">
                    <DateText date={customer.createdAt} withTime />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotation History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Lịch sử báo giá khách hàng
              </h2>
            </div>
            <Button size="sm" asChild className="gap-1.5">
              <Link to={`/customers/${customer.id}/quotations/new?mode=manual`}>
                <Plus className="size-4" />
                <span>Tạo báo giá mới</span>
              </Link>
            </Button>
          </div>

          {isQuotationsLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : isQuotationsError ? (
            <ErrorState
              title="Không thể tải lịch sử báo giá"
              message="Đã xảy ra lỗi khi truy vấn danh sách báo giá của khách hàng từ máy chủ."
              onRetry={() => void refetchQuotations()}
            />
          ) : quotations.length === 0 ? (
            <EmptyState
              title="Chưa có báo giá nào"
              description="Khách hàng này hiện chưa có báo giá nào trong hệ thống. Hãy tạo báo giá đầu tiên ngay bây giờ."
              action={
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={`/customers/${customer.id}/quotations/new?mode=manual`}>
                    <Plus className="size-4" />
                    <span>Tạo báo giá ngay</span>
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <QuotationHistoryTable
                  quotations={quotations}
                  paginationSlot={
                    meta && meta.totalPages > 1 ? (
                      <TablePagination
                        page={meta.page}
                        limit={meta.limit}
                        total={meta.total}
                        totalPages={meta.totalPages}
                        onPageChange={handlePageChange}
                      />
                    ) : undefined
                  }
                />
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden">
                <QuotationHistoryCardList
                  quotations={quotations}
                  paginationSlot={
                    meta && meta.totalPages > 1 ? (
                      <TablePagination
                        page={meta.page}
                        limit={meta.limit}
                        total={meta.total}
                        totalPages={meta.totalPages}
                        onPageChange={handlePageChange}
                      />
                    ) : undefined
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Customer Sheet */}
      <CustomerFormSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        customer={customer}
      />
    </PageContainer>
  )
}
