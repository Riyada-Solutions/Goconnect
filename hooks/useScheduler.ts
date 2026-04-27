import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  checkInAppointment,
  confirmAppointment,
  getSlotById,
  getSlots,
} from '../data/scheduler_repository'
import type { Slot } from '../data/models/scheduler'

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

function useSlotStatusMutation(
  fn: (id: number) => Promise<Slot>,
): ReturnType<typeof useMutation<Slot, Error, number>> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (slot) => {
      qc.setQueryData(['slots', slot.id], slot)
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export const useConfirmAppointment = () => useSlotStatusMutation(confirmAppointment)
export const useCheckInAppointment = () => useSlotStatusMutation(checkInAppointment)
