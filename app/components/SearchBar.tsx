'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

const DEBOUNCE_MS = 350

export default function SearchBar({
  placeholder = 'Search communities, posts, and people…',
}: {
  placeholder?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeQuery = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(activeQuery)
  const [isPending, startTransition] = useTransition()

  // The last term we pushed into the URL — used to avoid redundant navigations
  // and to tell a user edit apart from a back/forward navigation.
  const lastPushed = useRef(activeQuery)

  useEffect(() => {
    if (activeQuery !== lastPushed.current) {
      setQuery(activeQuery)
      lastPushed.current = activeQuery
    }
  }, [activeQuery])

  function navigate(term: string) {
    lastPushed.current = term
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) params.set('q', term)
      else params.delete('q')
      const qs = params.toString()
      router.replace(qs ? `/search?${qs}` : '/search')
    })
  }

  // Debounce so each keystroke no longer fires a request.
  useEffect(() => {
    const term = query.trim()
    if (term === lastPushed.current) return

    const timer = setTimeout(() => navigate(term), DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        navigate(query.trim())
      }}
      className="relative w-full"
    >
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        autoComplete="off"
        className="field py-2.5 pl-10 pr-10"
      />

      {isPending && (
        <span
          className="absolute right-10 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-brand border-t-transparent"
          aria-hidden="true"
        />
      )}

      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('')
            navigate('')
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
