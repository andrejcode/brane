import { useEffect, useState } from 'react'

export const SEARCH_DEBOUNCE_MS = 200

interface UseDebouncedQueryOptions {
  resetOnActivate?: boolean
}

export function useDebouncedQuery({
  resetOnActivate,
}: UseDebouncedQueryOptions = {}) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [wasActive, setWasActive] = useState(resetOnActivate)

  if (resetOnActivate !== wasActive) {
    setWasActive(resetOnActivate)
    if (resetOnActivate) {
      setQuery('')
      setDebouncedQuery('')
    }
  }

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedQuery(query),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timeout)
  }, [query])

  const normalizedQuery = debouncedQuery.trim().toLowerCase()

  return { query, debouncedQuery, normalizedQuery, setQuery }
}
