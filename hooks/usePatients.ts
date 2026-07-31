import { getPatientById, getPatientsPage, PATIENTS_PER_PAGE } from '../data/patient_repository'
import { useOfflineInfiniteQuery } from './useOfflineInfiniteQuery'
import { useOfflineQuery } from './useOfflineQuery'

const CACHE_24H = 24 * 60 * 60 * 1000

export function usePatients(search?: string) {
  const q = search?.trim() || undefined
  return useOfflineInfiniteQuery({
    queryKey: ['patients', q ?? ''],
    queryFn: (pageParam) => getPatientsPage(PATIENTS_PER_PAGE, pageParam as number, q),
    initialPageParam: 1,
    getNextPageParam: (last) => last.hasMore ? last.meta.current_page + 1 : undefined,
    cacheTtl: 5 * 60 * 1000,
  })
}

export function usePatient(id: number) {
  return useOfflineQuery({
    queryKey: ['patients', id],
    queryFn: () => getPatientById(id),
    cacheTtl: 5 * 60 * 1000,
    enabled: !!id,
  })
}
