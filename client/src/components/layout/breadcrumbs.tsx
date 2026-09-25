import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export interface BreadcrumbItemType {
  label: string
  href?: string
}

interface AppBreadcrumbsProps {
  items?: BreadcrumbItemType[]
}

const routeNameMap: Record<string, string> = {
  customers: 'Khách hàng',
  products: 'Sản phẩm',
  quotations: 'Báo giá',
  new: 'Tạo mới',
}

export function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  const location = useLocation()

  if (items && items.length > 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/customers">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <React.Fragment key={`${item.label}-${index}`}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const pathSegments = location.pathname.split('/').filter(Boolean)
  if (pathSegments.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/customers">Trang chủ</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1
          const href = '/' + pathSegments.slice(0, index + 1).join('/')
          const label = routeNameMap[segment] ?? segment

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
