import * as React from 'react'
import { cn } from '@/lib/utils'
import { AppBreadcrumbs, type BreadcrumbItemType } from './breadcrumbs'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  breadcrumbs?: BreadcrumbItemType[]
  showBreadcrumbs?: boolean
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
  showBreadcrumbs = true,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 space-y-3', className)}>
      {showBreadcrumbs && (
        <div className="text-xs text-muted-foreground">
          <AppBreadcrumbs items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2 pt-1 sm:pt-0">{action}</div>}
      </div>
    </div>
  )
}
