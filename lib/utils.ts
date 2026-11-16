// cn() — merge Tailwind / CSS class strings safely
type ClassValue = string | number | boolean | undefined | null | ClassValue[]

function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Re-export for convenience
export { cn }

/** Convert a string to a URL-safe slug */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Format a date string to a readable format */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr))
}

/** Format a date string to a relative time (e.g. "3 hours ago") */
export function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}

/** Format a datetime for a Google Calendar URL */
export function formatGCalDate(dateStr: string): string {
  return new Date(dateStr)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/** Generate a Google Calendar URL for an event */
export function getGCalUrl(params: {
  title: string
  description?: string | null
  location?: string | null
  startAt: string
  endAt?: string | null
}): string {
  const start = formatGCalDate(params.startAt)
  const end = params.endAt ? formatGCalDate(params.endAt) : start
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', params.title)
  url.searchParams.set('dates', `${start}/${end}`)
  if (params.description) url.searchParams.set('details', params.description)
  if (params.location) url.searchParams.set('location', params.location)
  return url.toString()
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 3) + '...'
}

/** Get initials from a name for avatar fallback */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Check if an error is an internal Next.js control-flow signal (redirect, notFound, dynamic bailout) */
export function isNextInternalError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'digest' in error) {
    const digest = String((error as { digest?: string }).digest)
    return (
      digest.startsWith('NEXT_') ||
      digest === 'DYNAMIC_SERVER_USAGE' ||
      digest.includes('BAILOUT')
    )
  }
  return false
}
