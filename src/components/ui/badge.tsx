import React from 'react'

export function Badge({ children, variant = 'default', className }: React.PropsWithChildren<{ variant?: 'default' | 'secondary', className?: string }>) {
  const base = 'inline-block px-2 py-1 rounded text-xs font-semibold'
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-200 text-gray-700'
  }
  return <span className={`${base} ${variants[variant]} ${className ?? ''}`}>{children}</span>
}