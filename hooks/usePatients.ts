import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getPatientById, getPatientsPage, PATIENTS_PER_PAGE } from '../data/patient_repository'

export function usePatients(search?: string) {
  // Normalise so '' and undefined share one cache entry, and trimmed whitespace
  // doesn't spawn a redundant query.
  const q = search?.trim() || undefined
  return useInfiniteQuery({
    queryKey: ['patients', q ?? ''],
    queryFn: ({ pageParam = 1 }) => getPatientsPage(PATIENTS_PER_PAGE, pageParam as number, q),
    initialPageParam: 1,
    getNextPageParam: (last) => last.hasMore ? last.meta.current_page + 1 : undefined,
    staleTime: 30_000,
  })
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => getPatientById(id),
    staleTime: 30_000,
    enabled: !!id,
  })
}
