import NetInfo from '@react-native-community/netinfo'
import { useInfiniteQuery, type UseInfiniteQueryOptions, type UseInfiniteQueryResult } from '@tanstack/react-query'
import { cacheService } from '@/data/cache_service'
import { log } from '@/utils/logger'

interface PagedResponse<T> {
  data?: T[]
  items?: T[]
  hasMore: boolean
  meta?: Record<string, any>
}

interface OfflineInfiniteQueryOptions<T, K> extends Omit<UseInfiniteQueryOptions<PagedResponse<T>>, 'queryFn'> {
  /** Fetches a single page. */
  queryFn: (pageParam: K) => Promise<PagedResponse<T>>
  /** Cache TTL in milliseconds. 0 = cache forever. Default: 5min */
  cacheTtl?: number
  /** Prefix for cache key. Default: 'query' */
  cachePrefix?: string
}

/**
 * Drop-in replacement for useInfiniteQuery that adds offline caching.
 * Caches all pages separately and restores them in order offline.
 *
 * Example:
 * ```
 * const { data, hasNextPage } = useOfflineInfiniteQuery({
 *   queryKey: ['visits', date],
 *   queryFn: (page) => getVisitsPage(10, page, date),
 *   initialPageParam: 1,
 *   getNextPageParam: (last) => last.hasMore ? last.meta.current_page + 1 : undefined,
 *   cacheTtl: 5 * 60 * 1000,
 * })
 * ```
 */
export function useOfflineInfiniteQuery<T, K>({
  queryKey,
  queryFn,
  cacheTtl = 5 * 60 * 1000,
  cachePrefix = 'query',
  ...options
}: OfflineInfiniteQueryOptions<T, K>): UseInfiniteQueryResult<PagedResponse<T>> {
  const baseCacheKey = `${cachePrefix}:${JSON.stringify(queryKey)}`

  return useInfiniteQuery({
    queryKey,
    staleTime: cacheTtl,
    gcTime: cacheTtl,
    retry: (failureCount, error: any) => {
      // Retry on network errors, but not on API errors (4xx, 5xx)
      if (error?.response?.status) return false
      // For non-HTTP errors (like data processing errors), retry once
      return failureCount < 2
    },
    queryFn: async ({ pageParam }) => {
      const state = await NetInfo.fetch()
      const online = !!state.isConnected && state.isInternetReachable !== false
      const pageCacheKey = `${baseCacheKey}:page:${pageParam}`

      if (!online) {
        // Offline: return cached page if available
        const cached = await cacheService.get<PagedResponse<T>>(pageCacheKey)
        if (cached) {
          log(`useOfflineInfiniteQuery(${pageCacheKey}) → cached`, { online: false })
          return cached
        }
        throw new Error('Offline and no cached page data')
      }

      try {
        // Online: fetch fresh, cache result
        const data = await queryFn(pageParam as K)
        await cacheService.set(pageCacheKey, data, cacheTtl)
        log(`useOfflineInfiniteQuery(${pageCacheKey}) → fresh`, { online: true })
        return data
      } catch (error: any) {
        log(`useOfflineInfiniteQuery(${pageCacheKey}) → error during queryFn`, {
          online: true,
          error: error?.message || String(error),
          hasResponse: !!error?.response,
          status: error?.response?.status
        })
        // Any error = try to fall back to cache
        const cached = await cacheService.get<PagedResponse<T>>(pageCacheKey)
        if (cached) {
          log(`useOfflineInfiniteQuery(${pageCacheKey}) → cached (error fallback)`, { online: true, error: error?.message })
          return cached
        }
        throw error
      }
    },
    ...options,
  })
}
