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
      // Never retry on HTTP errors (4xx, 5xx)
      if (error?.response?.status) return false
      // Disable retries on other errors - fall back to cache instead
      return false
    },
    queryFn: async ({ pageParam }) => {
      try {
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

          // Ensure data has the right structure
          if (!data) {
            throw new Error('No data returned from queryFn')
          }

          const hasMore = data.hasMore ?? (data.meta?.current_page ?? 0) < (data.meta?.last_page ?? 0)
          const safeData = {
            ...data,
            hasMore,
            meta: data.meta ?? {},
          }

          await cacheService.set(pageCacheKey, safeData, cacheTtl)
          log(`useOfflineInfiniteQuery(${pageCacheKey}) → fresh`, { online: true })
          return safeData
        } catch (error: any) {
          log(`useOfflineInfiniteQuery(${pageCacheKey}) → error during queryFn`, {
            online: true,
            error: error?.message || String(error),
            hasResponse: !!error?.response,
            status: error?.response?.status
          })
          // ALWAYS try to fall back to cache on any error
          const cached = await cacheService.get<PagedResponse<T>>(pageCacheKey)
          if (cached) {
            log(`useOfflineInfiniteQuery(${pageCacheKey}) → using cached data (error recovery)`, { online: true })
            return cached
          }
          // Only throw if we have absolutely no data
          throw error
        }
      } catch (error: any) {
        // Catch any unexpected errors
        log(`useOfflineInfiniteQuery → unexpected error`, {
          error: error?.message || String(error),
        })
        throw error
      }
    },
    ...options,
  })
}
