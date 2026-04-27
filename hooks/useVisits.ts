import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  endVisit,
  getVisitById,
  getVisits,
  saveProcedureTimes,
  startVisit,
  submitDoctorProgressNote,
  submitInventoryUsage,
  submitNursingProgressNote,
  submitReferral,
  submitRefusal,
  submitSariScreening,
  submitSocialWorkerProgressNote,
} from '../data/visit_repository'
import type { InventoryUsageInput, Visit } from '../data/models/visit'
import type { DoctorProgressNoteInput } from '../data/models/doctorProgressNote'
import type { ReferralInput } from '../data/models/referral'
import type { RefusalInput } from '../data/models/refusal'
import type { SariScreeningInput } from '../data/models/sariScreening'
import type { SocialWorkerLocation } from '../data/models/socialWorkerProgressNote'

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

/**
 * Every visit mutation returns the **updated Visit** (single source of truth).
 * On success we shove it straight into the React-Query cache so screens
 * re-render instantly without a network round-trip.
 */
function applyVisitUpdate(qc: ReturnType<typeof useQueryClient>, visit: Visit) {
  qc.setQueryData(['visits', visit.id], visit)
  qc.invalidateQueries({ queryKey: ['visits'] })
}

export function useSubmitNursingProgressNote(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, string>({
    mutationFn: (note) => submitNursingProgressNote({ visitId, note }),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

export function useSubmitSariScreening(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Omit<SariScreeningInput, 'visitId'>>({
    mutationFn: (input) => submitSariScreening({ visitId, ...input }),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

export function useSubmitRefusal(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Omit<RefusalInput, 'visitId'>>({
    mutationFn: (input) => submitRefusal({ visitId, ...input }),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

export function useSubmitDoctorProgressNote(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Omit<DoctorProgressNoteInput, 'visitId'>>({
    mutationFn: (input) => submitDoctorProgressNote({ visitId, ...input }),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

export function useSubmitReferral(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Omit<ReferralInput, 'visitId'>>({
    mutationFn: (input) => submitReferral({ visitId, ...input }),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

export function useSubmitSocialWorkerProgressNote(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, { note: string; location: SocialWorkerLocation }>({
    mutationFn: (input) => submitSocialWorkerProgressNote({ visitId, ...input }),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

export function useSubmitInventoryUsage(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Omit<InventoryUsageInput, 'visitId'>>({
    mutationFn: (input) => submitInventoryUsage({ visitId, ...input }),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}


function useVisitStatusMutation(
  fn: (id: number) => Promise<Visit>,
  visitId: number,
) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, void>({
    mutationFn: () => fn(visitId),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

export const useStartVisit = (visitId: number) =>
  useVisitStatusMutation(startVisit, visitId)
export const useEndVisit = (visitId: number) =>
  useVisitStatusMutation(endVisit, visitId)

export function useSaveProcedureTimes(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, { startTime?: string; endTime?: string }>({
    mutationFn: (body) => saveProcedureTimes(visitId, body),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}
