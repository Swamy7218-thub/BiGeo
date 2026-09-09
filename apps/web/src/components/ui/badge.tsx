import { cn } from '@/lib/utils'
import { getFlagColor, getFlagLabel } from '@/lib/utils'

interface BadgeProps {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  )
}

export function FlagBadge({ type }: { type: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      getFlagColor(type)
    )}>
      {getFlagLabel(type)}
    </span>
  )
}

export function BillStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    uploaded: 'bg-gray-100 text-gray-700',
    processing: 'bg-blue-100 text-blue-700',
    audited: 'bg-purple-100 text-purple-700',
    needs_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    uploaded: 'Uploaded',
    processing: 'Processing',
    audited: 'Audited',
    needs_review: 'Review Needed',
    approved: 'Approved',
    failed: 'Failed',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', classes[status] ?? 'bg-gray-100 text-gray-700')}>
      {labels[status] ?? status}
    </span>
  )
}
