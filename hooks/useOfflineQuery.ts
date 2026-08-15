import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'
import { cacheService } from '@/data/cache_service'
import { isEffectivelyOnline } from '@/context/NetworkContext'

interface OfflineQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  /** API call that fetches the data. */
  queryFn: () => Promise<T>
  /** Cache TTL in milliseconds. 0 = cache forever until manual clear. Default: 5min */
  cacheTtl?: number
  /** Prefix for cache key to avoid collisions. Default: 'query' */
  cachePrefix?: string
}

/**
 * Drop-in replacement for useQuery that adds offline caching.
 * - Online: fetches from API, caches result
 * - Offline: returns last cached value
 * - TTL: invalidates stale cache automatically
 *
 * Example:
 * ```
 * const { data: visits } = useOfflineQuery({
 *   queryKey: ['visits', id],
 *   queryFn: () => getVisits(id),
 *   cacheTtl: 5 * 60 * 1000, // 5 minutes
 * })
 * ```
 */
export function useOfflineQuery<T>({
  queryKey,
  queryFn,
  cacheTtl = 5 * 60 * 1000, // 5 minutes default
  cachePrefix = 'query',
  ...options
}: OfflineQueryOptions<T>): UseQueryResult<T> {
  const cacheKey = `${cachePrefix}:${JSON.stringify(queryKey)}`

  return useQuery({
    queryKey,
    staleTime: cacheTtl,
    gcTime: cacheTtl,
    retry: 0,
    queryFn: async () => {
      try {
        const online = await isEffectivelyOnline()

        if (!online) {
          // Offline: try cache first
          const cached = await cacheService.get<T>(cacheKey)
          if (cached) {
            console.log(`[useOfflineQuery] Offline cached for ${JSON.stringify(queryKey)}`)
            return cached
          }
          // No cache and offline = throw to show error
          throw new Error('Offline and no cached data')
        }

        try {
          // Online: fetch fresh, cache result
          const data = await queryFn()

          if (!data) {
            throw new Error('No data returned from queryFn')
          }

          await cacheService.set(cacheKey, data, cacheTtl)
          console.log(`[useOfflineQuery] Fresh data for ${JSON.stringify(queryKey)}`)
          return data
        } catch (error: any) {
          console.log(`[useOfflineQuery] Error for ${JSON.stringify(queryKey)}:`, error?.message || String(error))
          // ALWAYS MANDATORY: Try to fall back to cache on any error, even HTTP errors
          const cached = await cacheService.get<T>(cacheKey)
          if (cached) {
            console.log(`[useOfflineQuery] Using cached for ${JSON.stringify(queryKey)}`)
            return cached
          }

          // If no cache, return null instead of throwing
          console.log(`[useOfflineQuery] No cache, returning null for ${JSON.stringify(queryKey)}`)
          return null as any
        }
      } catch (error: any) {
        console.log(`[useOfflineQuery] Unexpected error in outer catch:`, error?.message || String(error))
        // Never throw: try cache, then return null
        const cached = await cacheService.get<T>(cacheKey)
        if (cached) {
          return cached
        }
        return null as any
      }
    },
    ...options,
  })
}
