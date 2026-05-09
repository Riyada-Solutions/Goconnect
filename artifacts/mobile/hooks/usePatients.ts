import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getPatientById, getPatientsPage, PATIENTS_PER_PAGE } from '../data/patient_repository'

export function usePatients() {
  return useInfiniteQuery({
    queryKey: ['patients'],
    queryFn: ({ pageParam = 1 }) => getPatientsPage(PATIENTS_PER_PAGE, pageParam as number),
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
