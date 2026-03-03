import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-700 text-gray-100',
    destructive: 'bg-red-600 text-white',
    outline: 'border border-gray-600 text-gray-100',
    success: 'bg-green-600 text-white',
  }
  return (
    <div
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant], className)}
      {...props}
    />
  )
}
