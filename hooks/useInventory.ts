import { useInfiniteQuery } from '@tanstack/react-query'
import { getInventoryPage } from '../data/inventory_repository'

const CACHE_24H = 24 * 60 * 60 * 1000

export function useInventory(patientId: number, visitId: number, search?: string) {
  const q = search?.trim() || undefined
  return useInfiniteQuery({
    queryKey: ['patient-inventory', patientId, visitId, q ?? ''],
    queryFn: ({ pageParam = 1 }) => getInventoryPage(patientId, visitId, pageParam as number, q),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.meta.current_page + 1 : undefined),
    staleTime: 5 * 60 * 1000,
    gcTime: CACHE_24H,
    networkMode: 'offlineFirst',
    enabled: !!patientId && !!visitId,
  })
}
