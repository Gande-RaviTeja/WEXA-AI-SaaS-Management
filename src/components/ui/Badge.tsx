import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'low-stock' | 'in-stock' | 'out-of-stock' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  'out-of-stock': 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  'low-stock': 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20',
  'in-stock': 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
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
