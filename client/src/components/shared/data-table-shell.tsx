import * as React from 'react'
import { cn } from '@/lib/utils'

interface DataTableShellProps {
  children: React.ReactNode
  pagination?: React.ReactNode
  className?: string
  tableClassName?: string
}

export function DataTableShell({
  children,
  pagination,
  className,
  tableClassName,
}: DataTableShellProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className={cn('rounded-lg border border-border bg-card shadow-xs overflow-hidden', tableClassName)}>
        <div className="overflow-x-auto">
          {children}
        </div>
      </div>
      {pagination && <div>{pagination}</div>}
    </div>
  )
}
