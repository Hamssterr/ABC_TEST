import * as React from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { LoadingState } from '@/components/shared/loading-skeleton'

const CustomersPage = React.lazy(() => import('@/pages/customers-page'))
const CustomerDetailPage = React.lazy(() => import('@/pages/customer-detail-page'))
const NewQuotationPage = React.lazy(() => import('@/pages/new-quotation-page'))
const QuotationDetailPage = React.lazy(() => import('@/pages/quotation-detail-page'))
const ProductsPage = React.lazy(() => import('@/pages/products-page'))
const NotFoundPage = React.lazy(() => import('@/pages/not-found-page'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/customers" replace />,
      },
      {
        path: 'customers',
        element: (
          <React.Suspense fallback={<LoadingState />}>
            <CustomersPage />
          </React.Suspense>
        ),
      },
      {
        path: 'customers/:customerId',
        element: (
          <React.Suspense fallback={<LoadingState />}>
            <CustomerDetailPage />
          </React.Suspense>
        ),
      },
      {
        path: 'customers/:customerId/quotations/new',
        element: (
          <React.Suspense fallback={<LoadingState />}>
            <NewQuotationPage />
          </React.Suspense>
        ),
      },
      {
        path: 'quotations/:quotationId',
        element: (
          <React.Suspense fallback={<LoadingState />}>
            <QuotationDetailPage />
          </React.Suspense>
        ),
      },
      {
        path: 'products',
        element: (
          <React.Suspense fallback={<LoadingState />}>
            <ProductsPage />
          </React.Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <React.Suspense fallback={<LoadingState />}>
            <NotFoundPage />
          </React.Suspense>
        ),
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
