import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps extends React.ComponentProps<'div'> {
  maxWidth?: '7xl' | 'full'
}

export function PageContainer({
  children,
  className,
  maxWidth = '7xl',
  ...props
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'w-full mx-auto px-4 py-6 md:px-6 lg:px-8',
        maxWidth === '7xl' && 'max-w-[1440px]',
        maxWidth === 'full' && 'max-w-none',
        className
      )}
      {...props}
    >
      {children}
    </main>
  )
}
