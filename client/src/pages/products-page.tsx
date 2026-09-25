import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTableShell } from '@/components/shared/data-table-shell'
import { TablePagination } from '@/components/shared/table-pagination'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog'
import { ProductTable } from '@/components/products/product-table'
import { ProductCardList } from '@/components/products/product-card-list'
import { ProductFormSheet } from '@/components/products/product-form-sheet'
import { useProducts, useDeleteProduct } from '@/hooks/use-products'
import { parsePaginationParams, buildPaginationSearchParams } from '@/lib/pagination'
import type { Product } from '@/types/product'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { page, limit } = parsePaginationParams(searchParams, 1, 10)

  const { data, isLoading, isError, refetch } = useProducts({ page, limit })

  // State for create / edit sheet
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)

  // State for delete dialog
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)

  const deleteMutation = useDeleteProduct({
    onSuccess: () => {
      setDeletingProduct(null)
      if (data?.data && data.data.length === 1 && page > 1) {
        setSearchParams(buildPaginationSearchParams(page - 1, limit))
      }
    },
  })

  const handlePageChange = (newPage: number) => {
    setSearchParams(buildPaginationSearchParams(newPage, limit))
  }

  const handleOpenCreate = () => {
    setEditingProduct(null)
    setIsSheetOpen(true)
  }

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setIsSheetOpen(true)
  }

  const handleOpenDelete = (product: Product) => {
    setDeletingProduct(product)
  }

  const handleConfirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id)
    }
  }

  const products = data?.data ?? []
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 }

  return (
    <PageContainer>
      <PageHeader
        title="Sản phẩm"
        description="Quản lý danh mục hàng hóa, đơn vị tính, quy cách và đơn giá niêm yết"
        action={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="size-4" />
            <span>Thêm sản phẩm</span>
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : isError ? (
        <ErrorState
          title="Không thể tải danh sách sản phẩm"
          message="Đã có lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra lại dịch vụ backend."
          onRetry={() => void refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title="Chưa có sản phẩm nào"
          description="Khởi tạo danh mục sản phẩm và bảng giá để bắt đầu lập báo giá cho khách hàng."
          action={
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="size-4" />
              <span>Thêm sản phẩm mới</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop view */}
          <div className="hidden md:block">
            <DataTableShell
              pagination={
                <TablePagination
                  page={meta.page}
                  limit={meta.limit}
                  total={meta.total}
                  totalPages={meta.totalPages}
                  onPageChange={handlePageChange}
                />
              }
            >
              <ProductTable
                products={products}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            </DataTableShell>
          </div>

          {/* Mobile view */}
          <div className="block md:hidden space-y-4">
            <ProductCardList
              products={products}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
            <TablePagination
              page={meta.page}
              limit={meta.limit}
              total={meta.total}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}

      {/* Form Sheet for Create / Edit */}
      <ProductFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        product={editingProduct}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmDeleteDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Xác nhận xóa sản phẩm"
        itemName={deletingProduct ? `${deletingProduct.sku} - ${deletingProduct.name}` : undefined}
        description={
          deletingProduct
            ? `Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct.name}" (${deletingProduct.sku}) không?`
            : undefined
        }
        isDeleting={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </PageContainer>
  )
}
