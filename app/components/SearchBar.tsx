'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function SearchBar({
  placeholder = 'Search communities, posts, and people...',
}: {
  placeholder?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSearch(term: string) {
    setQuery(term)
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      if (term) {
        params.set('q', term)
      } else {
        params.delete('q')
      }
      router.replace(`/search?${params.toString()}`)
    })
  }

  function handleClear() {
    setQuery('')
    startTransition(() => {
      router.replace('/search')
    })
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-brand focus:outline-hidden transition-all text-sm shadow-xs"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  )
}
