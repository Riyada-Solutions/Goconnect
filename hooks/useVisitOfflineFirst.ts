import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { isEffectivelyOnline } from "@/context/NetworkContext";
import { visitCacheRepository } from "@/data/offline_visit_cache";
import { log } from "@/utils/logger";

interface VisitOfflineFirstOptions<T>
  extends Omit<UseQueryOptions<T>, "queryFn"> {
  queryFn: () => Promise<T>;
  visitId: number;
  preferCache?: boolean; // true = try cache first even if online
  cacheTtl?: number; // React Query staleTime
  offlineTtl?: number; // How long offline cache stays valid
}

/**
 * Offline-first visit loader.
 *
 * Logic:
 * 1. Device offline + cache exists → return cached (staleTime = Infinity)
 * 2. Device offline + no cache → throw error
 * 3. Device online + cache exists + preferCache → return cached, fetch in background
 * 4. Device online + no cache → fetch from server, cache on success
 *
 * Example:
 * ```
 * const { data: visit } = useVisitOfflineFirst({
 *   queryKey: ['visit', visitId],
 *   queryFn: () => getVisit(visitId),
 *   visitId: numId,
 *   cacheTtl: 2 * 60 * 1000,
 * })
 * ```
 */
export function useVisitOfflineFirst<T>({
  queryKey,
  queryFn,
  visitId,
  preferCache = false,
  cacheTtl = 2 * 60 * 1000,
  offlineTtl = 24 * 60 * 60 * 1000,
  ...options
}: VisitOfflineFirstOptions<T>): UseQueryResult<T> {
  return useQuery({
    queryKey,
    staleTime: cacheTtl,
    gcTime: Math.max(cacheTtl, 30 * 60 * 1000),
    retry: 1,
    queryFn: async () => {
      const online = await isEffectivelyOnline();

      log(
        "[useVisitOfflineFirst]",
        `Loading visit ${visitId} (online=${online}, preferCache=${preferCache})`,
      );

      // Try to load from cache first if offline or preferCache is true
      if (!online || preferCache) {
        try {
          const cached = await visitCacheRepository.getVisitFromCache(visitId);
          if (cached) {
            log(
              "[useVisitOfflineFirst]",
              `Using cached visit ${visitId}`,
            );
            return cached.visit as T;
          }
        } catch (cacheError) {
          log(
            "[useVisitOfflineFirst]",
            `Cache read failed: ${cacheError}`,
          );
        }

        // If offline and no cache, throw error
        if (!online) {
          throw new Error(
            `Visit not available offline. Please go online to open this visit.`,
          );
        }

        // Online but cache read failed; continue to network fetch
      }

      // Fetch from server
      try {
        log(
          "[useVisitOfflineFirst]",
          `Fetching visit ${visitId} from server`,
        );
        const data = await queryFn();

        if (!data) {
          throw new Error("No data returned from queryFn");
        }

        // Cache the response for offline use
        // Note: Full cache entry would be built by prefetch; we just update the visit payload here
        await visitCacheRepository.updateVisitCache(visitId, data as Record<string, any>);

        return data;
      } catch (error: any) {
        log(
          "[useVisitOfflineFirst]",
          `Server fetch failed: ${error?.message}. Trying cache as fallback.`,
        );

        // Fallback to cache on network error
        try {
          const cached = await visitCacheRepository.getVisitFromCache(visitId);
          if (cached) {
            log(
              "[useVisitOfflineFirst]",
              `Using stale cache for visit ${visitId} after network error`,
            );
            return cached.visit as T;
          }
        } catch {
          // Cache also failed, re-throw original error
        }

        throw error;
      }
    },
    ...options,
  });
}
