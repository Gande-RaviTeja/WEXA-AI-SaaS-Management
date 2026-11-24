import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'low-stock' | 'in-stock' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  'low-stock': 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  'in-stock': 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
  neutral: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20',
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
