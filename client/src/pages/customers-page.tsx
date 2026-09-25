import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { TablePagination } from "@/components/shared/table-pagination";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerCardList } from "@/components/customers/customer-card-list";
import { CustomerFormSheet } from "@/components/customers/customer-form-sheet";
import { useCustomers, useDeleteCustomer } from "@/hooks/use-customers";
import {
  parsePaginationParams,
  buildPaginationSearchParams,
} from "@/lib/pagination";
import type { Customer } from "@/types/customer";

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, limit } = parsePaginationParams(searchParams, 1, 10);

  const { data, isLoading, isError, refetch } = useCustomers({ page, limit });

  // State for create / edit sheet
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(
    null,
  );

  // State for delete dialog
  const [deletingCustomer, setDeletingCustomer] =
    React.useState<Customer | null>(null);

  const deleteMutation = useDeleteCustomer({
    onSuccess: () => {
      setDeletingCustomer(null);
      // If deleted last item on page > 1, step back one page
      if (data?.data && data.data.length === 1 && page > 1) {
        setSearchParams(buildPaginationSearchParams(page - 1, limit));
      }
    },
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams(buildPaginationSearchParams(newPage, limit));
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsSheetOpen(true);
  };

  const handleOpenDelete = (customer: Customer) => {
    setDeletingCustomer(customer);
  };

  const handleConfirmDelete = () => {
    if (deletingCustomer) {
      deleteMutation.mutate(deletingCustomer.id);
    }
  };

  const customers = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  return (
    <PageContainer>
      <PageHeader
        title="Khách hàng"
        description="Quản lý hồ sơ khách hàng và kết nối lịch sử báo giá"
        action={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="size-4" />
            <span>Thêm khách hàng</span>
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : isError ? (
        <ErrorState
          title="Không thể tải danh sách khách hàng"
          message="Đã có lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra lại dịch vụ backend."
          onRetry={() => void refetch()}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Chưa có khách hàng nào"
          description="Bắt đầu quản lý kinh doanh bằng cách tạo hồ sơ khách hàng đầu tiên."
          action={
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="size-4" />
              <span>Thêm khách hàng mới</span>
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
              }>
              <CustomerTable
                customers={customers}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            </DataTableShell>
          </div>

          {/* Mobile view */}
          <div className="block md:hidden space-y-4">
            <CustomerCardList
              customers={customers}
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
      <CustomerFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        customer={editingCustomer}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmDeleteDialog
        open={Boolean(deletingCustomer)}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
        title="Xác nhận xóa khách hàng"
        itemName={
          deletingCustomer
            ? `${deletingCustomer.code} - ${deletingCustomer.name}`
            : undefined
        }
        description={
          deletingCustomer
            ? `Bạn có chắc chắn muốn xóa khách hàng "${deletingCustomer.name}" (${deletingCustomer.code}) không?`
            : undefined
        }
        isDeleting={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </PageContainer>
  );
}
