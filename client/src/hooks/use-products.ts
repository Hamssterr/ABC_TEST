import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/api/products-api'
import { queryKeys } from '@/lib/query-keys'
import { showApiErrorToast } from '@/lib/error-toast'
import type { CreateProductInput, UpdateProductInput } from '@/types/product'
import type { PaginationParams } from '@/types/common'

export function useProducts(params: PaginationParams = { page: 1, limit: 10 }) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return useQuery({
    queryKey: queryKeys.products.list({ page, limit }),
    queryFn: () => getProducts({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  })
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: id ? queryKeys.products.detail(id) : ['products', 'detail', ''],
    queryFn: () => getProduct(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  })
}

export function useCreateProduct(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      toast.success('Tạo sản phẩm thành công')
      options?.onSuccess?.()
    },
    onError: (error: unknown) => {
      showApiErrorToast(error, 'Không thể tạo sản phẩm')
    },
  })
}

export function useUpdateProduct(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      updateProduct(id, input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.id),
      })
      toast.success('Cập nhật sản phẩm thành công')
      options?.onSuccess?.()
    },
    onError: (error: unknown) => {
      showApiErrorToast(error, 'Không thể cập nhật sản phẩm')
    },
  })
}

export function useDeleteProduct(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      toast.success('Xóa sản phẩm thành công')
      options?.onSuccess?.()
    },
    onError: (error: unknown) => {
      showApiErrorToast(error, 'Không thể xóa sản phẩm')
    },
  })
}
