import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useOfflineQuery } from './useOfflineQuery'
import { OfflineQueuedError } from '../data/offline_api'
import { cacheService } from '../data/cache_service'
import {
  cancelAppointment,
  checkInAppointment,
  confirmAppointment,
  confirmAppointmentForNurse,
  getSlotById,
  getSlots,
  primeVisitCacheFromSlot,
  type SlotsQuery,
} from '../data/scheduler_repository'
import type { Slot } from '../data/models/scheduler'

export function useSlots(query?: SlotsQuery) {
  return useOfflineQuery({
    queryKey: ['slots', query?.date ?? null],
    queryFn: () => getSlots(query),
    cacheTtl: 30_000,
    cachePrefix: 'slots',
  })
}

export function useSlot(id: number) {
  const qc = useQueryClient()
  return useOfflineQuery({
    queryKey: ['slots', id],
    queryFn: async () => {
      const slot = await getSlotById(id)
      primeVisitCacheFromSlot(qc, slot)
      return slot
    },
    cacheTtl: 2 * 60 * 1000,
    cachePrefix: 'slots',
    // Always refetch on mount so reopening the appointment detail screen
    // pulls fresh data when online — offline falls back to cache regardless.
    refetchOnMount: 'always',
    enabled: !!id,
  })
}

/** Optimistically flip a cached slot's status when the transition was queued
 *  offline (no fresh Slot back from the server to merge in). Updates both the
 *  live query cache (so the open screen re-renders immediately) and the disk
 *  cache `useSlot`/`useOfflineQuery` reads from, so the status still shows
 *  "checked in" etc. if the app is restarted before the queue syncs. */
function applyOptimisticStatus(qc: ReturnType<typeof useQueryClient>, slotId: number, status: string) {
  qc.setQueryData(['slots', slotId], (old: Slot | undefined) =>
    old ? { ...old, status } : old,
  )
  const cacheKey = `slots:${JSON.stringify(['slots', slotId])}`
  cacheService.get<Slot>(cacheKey).then((cached) => {
    if (cached) void cacheService.set(cacheKey, { ...cached, status }, 2 * 60 * 1000)
  })
}

function useSlotStatusMutation(
  fn: (id: number) => Promise<Slot>,
  optimisticStatus: string,
): ReturnType<typeof useMutation<Slot, Error, number>> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (slot) => {
      qc.setQueryData(['slots', slot.id], slot)
      qc.invalidateQueries({ queryKey: ['slots'] })
      primeVisitCacheFromSlot(qc, slot)
    },
    onError: (err, slotId) => {
      if (err instanceof OfflineQueuedError) applyOptimisticStatus(qc, slotId, optimisticStatus)
    },
  })
}

export const useConfirmAppointment = () => useSlotStatusMutation(confirmAppointment, 'confirmed')
export const useCheckInAppointment = () => useSlotStatusMutation(checkInAppointment, 'checked_in')

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
    onError: (err, { id }) => {
      if (err instanceof OfflineQueuedError) applyOptimisticStatus(qc, id, 'canceled')
    },
  })
}
