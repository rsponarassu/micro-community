import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'error' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

// Every variant resolves through theme tokens, so badges stay legible in dark mode.
const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)' },
  brand: { background: 'var(--color-brand-subtle)', color: 'var(--color-brand)' },
  success: { background: 'var(--color-success-subtle)', color: 'var(--color-success)' },
  warning: { background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' },
  error: { background: 'var(--color-danger-subtle)', color: 'var(--color-danger)' },
  muted: { background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)' },
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5',
        className
      )}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  )
}
