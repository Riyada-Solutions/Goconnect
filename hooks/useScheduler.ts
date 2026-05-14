import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelAppointment,
  checkInAppointment,
  confirmAppointment,
  confirmAppointmentForNurse,
  getSlotById,
  getSlots,
  type SlotsQuery,
} from '../data/scheduler_repository'
import type { Slot } from '../data/models/scheduler'

export function useSlots(query?: SlotsQuery) {
  return useQuery({
    queryKey: ['slots', query?.date ?? null],
    queryFn: () => getSlots(query),
    staleTime: 30_000,
  })
}

export function useSlot(id: number) {
  return useQuery({
    queryKey: ['slots', id],
    queryFn: () => getSlotById(id),
    staleTime: 0,
    // Always refetch on mount so reopening the appointment detail screen
    // shows the skeleton and pulls fresh data from the API.
    refetchOnMount: 'always',
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

export function useConfirmAppointmentForNurse() {
  const qc = useQueryClient()
  return useMutation<Slot, Error, { slotId: number; nurseId: number | string }>({
    mutationFn: ({ slotId, nurseId }) => confirmAppointmentForNurse(slotId, nurseId),
    onSuccess: (slot) => {
      qc.setQueryData(['slots', slot.id], slot)
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

/** Cancel takes both the slot id and a free-text `reason` that the backend
 *  requires (`{ reason: string }` in the POST body). */
export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation<Slot, Error, { id: number; reason: string }>({
    mutationFn: ({ id, reason }) => cancelAppointment(id, reason),
    onSuccess: (slot) => {
      qc.setQueryData(['slots', slot.id], slot)
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}
