import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getPatientById, getPatientsPage, PATIENTS_PER_PAGE } from '../data/patient_repository'

const CACHE_24H = 24 * 60 * 60 * 1000

export function usePatients(search?: string) {
  const q = search?.trim() || undefined
  return useInfiniteQuery({
    queryKey: ['patients', q ?? ''],
    queryFn: ({ pageParam = 1 }) => getPatientsPage(PATIENTS_PER_PAGE, pageParam as number, q),
    initialPageParam: 1,
    getNextPageParam: (last) => last.hasMore ? last.meta.current_page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: CACHE_24H,
    networkMode: 'offlineFirst',
  })
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => getPatientById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: CACHE_24H,
    networkMode: 'offlineFirst',
    enabled: !!id,
  })
}
