import NetInfo from '@react-native-community/netinfo'
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'
import { cacheService } from '@/data/cache_service'
import { log } from '@/utils/logger'

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
    retry: (failureCount, error: any) => {
      // Retry on network errors, but not on API errors (4xx, 5xx)
      if (error?.response?.status) return false
      // For non-HTTP errors (like data processing errors), retry once
      return failureCount < 2
    },
    queryFn: async () => {
      const state = await NetInfo.fetch()
      const online = !!state.isConnected && state.isInternetReachable !== false

      if (!online) {
        // Offline: try cache first
        const cached = await cacheService.get<T>(cacheKey)
        if (cached) {
          log(`useOfflineQuery(${cacheKey}) → cached`, { online: false })
          return cached
        }
        // No cache and offline = throw to show error
        throw new Error('Offline and no cached data')
      }

      try {
        // Online: fetch fresh, cache result
        const data = await queryFn()
        await cacheService.set(cacheKey, data, cacheTtl)
        log(`useOfflineQuery(${cacheKey}) → fresh`, { online: true })
        return data
      } catch (error: any) {
        // Any error = try to fall back to cache
        const cached = await cacheService.get<T>(cacheKey)
        if (cached) {
          log(`useOfflineQuery(${cacheKey}) → cached (error fallback)`, { online: true, error: error?.message })
          return cached
        }
        throw error
      }
    },
    ...options,
  })
}
