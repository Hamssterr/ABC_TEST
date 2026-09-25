import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AsyncButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean
  loadingText?: string
}

export function AsyncButton({
  children,
  isLoading = false,
  loadingText,
  disabled,
  ...props
}: AsyncButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin mr-2" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
