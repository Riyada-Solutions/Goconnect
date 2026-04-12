import { useQuery } from '@tanstack/react-query'
import { getVisits, getVisitById, getMedications, getInventory } from '../data/visit_repository'

export function useVisits() {
  return useQuery({
    queryKey: ['visits'],
    queryFn: getVisits,
    staleTime: 30_000,
  })
}

export function useVisit(id: number) {
  return useQuery({
    queryKey: ['visits', id],
    queryFn: () => getVisitById(id),
    staleTime: 30_000,
    enabled: !!id,
  })
}

export function useMedications() {
  return useQuery({
    queryKey: ['medications'],
    queryFn: getMedications,
    staleTime: 60_000,
  })
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
    staleTime: 60_000,
  })
}
