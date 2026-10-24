import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'error' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)' },
  brand: { background: 'var(--color-brand-subtle)', color: 'var(--color-brand)' },
  success: { background: 'hsl(142 71% 90%)', color: 'hsl(142 71% 30%)' },
  warning: { background: 'hsl(38 92% 90%)', color: 'hsl(38 92% 30%)' },
  error: { background: 'hsl(0 84% 92%)', color: 'hsl(0 84% 40%)' },
  muted: { background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)' },
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        className
      )}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  )
}
