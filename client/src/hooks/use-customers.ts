import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/api/customers-api'
import { queryKeys } from '@/lib/query-keys'
import { showApiErrorToast } from '@/lib/error-toast'
import type { CreateCustomerInput, UpdateCustomerInput } from '@/types/customer'
import type { PaginationParams } from '@/types/common'

export function useCustomers(params: PaginationParams = { page: 1, limit: 10 }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return useQuery({
    queryKey: queryKeys.customers.list({ page, limit }),
    queryFn: () => getCustomers({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  })
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: id ? queryKeys.customers.detail(id) : ['customers', 'detail', ''],
    queryFn: () => getCustomer(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  })
}

export function useCreateCustomer(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      toast.success('Tạo khách hàng thành công')
      options?.onSuccess?.()
    },
    onError: (error: unknown) => {
      showApiErrorToast(error, 'Không thể tạo khách hàng')
    },
  })
}

export function useUpdateCustomer(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      updateCustomer(id, input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(variables.id),
      })
      toast.success('Cập nhật thông tin khách hàng thành công')
      options?.onSuccess?.()
    },
    onError: (error: unknown) => {
      showApiErrorToast(error, 'Không thể cập nhật khách hàng')
    },
  })
}

export function useDeleteCustomer(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      toast.success('Xóa khách hàng thành công')
      options?.onSuccess?.()
    },
    onError: (error: unknown) => {
      showApiErrorToast(error, 'Không thể xóa khách hàng')
    },
  })
}
