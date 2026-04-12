import { useQuery } from '@tanstack/react-query'
import { getSlots, getSlotById } from '../data/scheduler_repository'

export function useSlots() {
  return useQuery({
    queryKey: ['slots'],
    queryFn: getSlots,
    staleTime: 30_000,
  })
}

export function useSlot(id: number) {
  return useQuery({
    queryKey: ['slots', id],
    queryFn: () => getSlotById(id),
    staleTime: 30_000,
    enabled: !!id,
  })
}
