import { useCallback, useEffect, useState } from 'react'

export const SEARCH_DEBOUNCE_MS = 200

export function useDebouncedQuery() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedQuery(query),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timeout)
  }, [query])

  const resetQuery = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
  }, [])

  return { query, debouncedQuery, setQuery, resetQuery }
}
