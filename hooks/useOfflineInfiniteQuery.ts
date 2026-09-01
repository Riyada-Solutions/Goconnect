import { useInfiniteQuery, type UseInfiniteQueryOptions, type UseInfiniteQueryResult } from '@tanstack/react-query'
import { cacheService } from '@/data/cache_service'
import { isEffectivelyOnline } from '@/context/NetworkContext'
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
  /** Offline cache TTL in milliseconds. How long prefetched data stays usable offline. Default: 4 hours */
  offlineTtl?: number
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
  offlineTtl = Math.max(cacheTtl, 4 * 60 * 60 * 1000), // 4 hours default, or longer if cacheTtl already exceeds it
  cachePrefix = 'query',
  ...options
}: OfflineInfiniteQueryOptions<T, K>): UseInfiniteQueryResult<PagedResponse<T>> {
  const baseCacheKey = `${cachePrefix}:${JSON.stringify(queryKey)}`
  const qkString = JSON.stringify(queryKey)

  return useInfiniteQuery({
    queryKey,
    staleTime: cacheTtl,
    gcTime: Math.max(cacheTtl, 30 * 60 * 1000), // floor at 30 min to keep in-memory cache warm across session nav
    retry: 0,
    queryFn: async ({ pageParam }) => {
      log('[useOfflineInfiniteQuery]', `Starting queryFn for ${qkString}, page: ${pageParam}`)
      const pageCacheKey = `${baseCacheKey}:page:${pageParam}`
      try {
        const online = await isEffectivelyOnline()

        if (!online) {
          log('[useOfflineInfiniteQuery]', `Device offline for ${qkString}`)
          // Offline: return cached page if available
          const cached = await cacheService.get<PagedResponse<T>>(pageCacheKey)
          if (cached) {
            log('[useOfflineInfiniteQuery]', `Offline cached for ${qkString}`)
            log('[useOfflineInfiniteQuery]', `Returning offline cached data for ${qkString}`)
            return cached
          }
          log('[useOfflineInfiniteQuery]', `Offline and no cache for ${qkString}, returning empty`)
          throw new Error('Offline and no cached page data')
        }

        try {
          // Online: fetch fresh, cache result
          log('[useOfflineInfiniteQuery]', `About to call queryFn for ${qkString}`)
          const data = await queryFn(pageParam as K)
          log('[useOfflineInfiniteQuery]', `queryFn returned for ${qkString}: ${JSON.stringify(data).substring(0, 100)}`)

          // Ensure data has the right structure
          if (!data) {
            log('[useOfflineInfiniteQuery]', `queryFn returned null/undefined for ${qkString}`)
            throw new Error('No data returned from queryFn')
          }

          log('[useOfflineInfiniteQuery]', `Processing response for ${qkString}, data.hasMore=${data.hasMore}`)
          const hasMore = data.hasMore ?? (data.meta?.current_page ?? 0) < (data.meta?.last_page ?? 0)
          log('[useOfflineInfiniteQuery]', `hasMore computed as ${hasMore} for ${qkString}`)

          const safeData = {
            ...data,
            hasMore,
            meta: data.meta ?? {},
          }
          log('[useOfflineInfiniteQuery]', `safeData created for ${qkString}, about to cache`)

          try {
            await cacheService.set(pageCacheKey, safeData, offlineTtl)
            log('[useOfflineInfiniteQuery]', `Cached successfully for ${qkString}`)
          } catch (cacheError) {
            log('[useOfflineInfiniteQuery]', `Cache error for ${qkString}: ${cacheError}`)
          }

          log('[useOfflineInfiniteQuery]', `✅ RETURNING FRESH DATA for ${qkString}: items=${safeData.data?.length ?? safeData.items?.length ?? 0}, hasMore=${safeData.hasMore}`)
          return safeData
        } catch (error: any) {
          log('[useOfflineInfiniteQuery]', `❌ INNER CATCH for ${qkString}: ${error?.message || String(error)}`)
          log('[useOfflineInfiniteQuery]', `Error during queryFn for ${qkString}: ${error?.message || String(error)}`)
          // ALWAYS MANDATORY: Try to fall back to cache on any error, even HTTP errors
          const cached = await cacheService.get<PagedResponse<T>>(pageCacheKey)
          if (cached) {
            log('[useOfflineInfiniteQuery]', `Using cached (error recovery) for ${qkString}`)
            log('[useOfflineInfiniteQuery]', `Returning cached data for ${qkString}`)
            return cached
          }

          // If no cache, return empty data instead of throwing
          log('[useOfflineInfiniteQuery]', `No cache, returning empty for ${qkString}`)
          log('[useOfflineInfiniteQuery]', `No cache available, returning empty for ${qkString}`)
          return {
            data: [],
            items: [],
            hasMore: false,
            meta: {},
          } as PagedResponse<T>
        }
      } catch (error: any) {
        log('[useOfflineInfiniteQuery]', `Unexpected error in outer catch for ${qkString}: ${error?.message || String(error)}`)
        log('[useOfflineInfiniteQuery]', `OUTER CATCH for ${qkString}: ${error}`)
        // Never throw: try cache, then return empty
        const cached = await cacheService.get<PagedResponse<T>>(pageCacheKey)
        if (cached) {
          log('[useOfflineInfiniteQuery]', `Outer catch returning cached for ${qkString}`)
          return cached
        }
        log('[useOfflineInfiniteQuery]', `Outer catch returning empty for ${qkString}`)
        return {
          data: [],
          items: [],
          hasMore: false,
          meta: {},
        } as PagedResponse<T>
      }
    },
    ...options,
  })
}
