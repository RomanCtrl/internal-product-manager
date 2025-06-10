import { cn } from '@/lib/utils'
import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'px-4 py-2 rounded font-medium transition-colors',
        variant === 'default'
          ? 'bg-foreground text-background hover:bg-gray-800'
          : 'bg-gray-200 text-foreground hover:bg-gray-300',
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'