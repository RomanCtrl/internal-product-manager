import React from 'react'

export function Card({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`bg-white rounded shadow p-4 ${className ?? ''}`}>{children}</div>
}

export function CardHeader({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`mb-2 ${className ?? ''}`}>{children}</div>
}

export function CardTitle({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <h2 className={`font-bold text-lg ${className ?? ''}`}>{children}</h2>
}

export function CardContent({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={className}>{children}</div>
}

export function CardFooter({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`mt-4 ${className ?? ''}`}>{children}</div>
}