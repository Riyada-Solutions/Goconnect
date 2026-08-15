import { keepPreviousData } from '@tanstack/react-query'
import { useOfflineInfiniteQuery } from './useOfflineInfiniteQuery'
import { getInventoryPage } from '../data/inventory_repository'

export function useInventory(patientId: number, visitId: number, search?: string) {
  const q = search?.trim() || undefined
  return useOfflineInfiniteQuery({
    queryKey: ['patient-inventory', patientId, visitId, q ?? ''],
    queryFn: (pageParam) => getInventoryPage(patientId, visitId, pageParam as number, q),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? (last.meta?.current_page ?? 0) + 1 : undefined),
    cacheTtl: 5 * 60 * 1000,
    cachePrefix: 'patient-inventory',
    enabled: !!patientId && !!visitId,
    placeholderData: keepPreviousData,
  })
}
