import type { UseInfiniteQueryResult } from '@tanstack/react-query'

/**
 * Wraps an infinite query result to suppress error state when data is available.
 * This prevents "Failed to load" errors from blocking the display of cached/fallback data.
 *
 * Usage:
 * ```typescript
 * const result = useVisits(date, status)
 * const safe = useSafeInfiniteQuery(result, (data) => data?.pages?.flatMap(p => p.items) ?? [])
 * // Now safe.shouldShowError will be true only if both isError AND no data
 * ```
 */
export function useSafeInfiniteQuery<T extends { pages?: Array<{ items?: any[] }> }>(
  query: UseInfiniteQueryResult<T>,
  getItems: (data: T | undefined) => any[],
) {
  const items = getItems(query.data)
  return {
    ...query,
    // Only show error if we have an error AND no data available
    shouldShowError: query.isError && !items.length,
  }
}
