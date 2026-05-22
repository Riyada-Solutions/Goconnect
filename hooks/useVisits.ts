import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  endVisit,
  getVisitById,
  getVisitsPage,
  VISITS_PER_PAGE,
  saveProcedureTimes,
  startVisit,
  submitDoctorProgressNote,
  submitInventoryUsage,
  submitMedicationAdministration,
  submitMorseFallsRiskAssessment,
  submitNursingProgressNote,
  submitReferral,
  submitRefusal,
  submitSariScreening,
  submitSocialWorkerProgressNote,
} from '../data/visit_repository'
import type { InventoryUsageInput, Visit } from '../data/models/visit'
import type { DoctorProgressNoteInput } from '../data/models/doctorProgressNote'
import type { MorseFallsRiskAssessmentInput } from '../data/models/morseFallsRisk'
import type { ReferralInput } from '../data/models/referral'
import type { RefusalInput } from '../data/models/refusal'
import type { SariScreeningInput } from '../data/models/sariScreening'
import type { SocialWorkerLocation } from '../data/models/socialWorkerProgressNote'

export function useVisits(date?: string) {
  return useInfiniteQuery({
    queryKey: ['visits', date ?? null],
    queryFn: ({ pageParam = 1 }) => getVisitsPage(VISITS_PER_PAGE, pageParam as number, date),
    initialPageParam: 1,
    getNextPageParam: (last) => last.hasMore ? last.meta.current_page + 1 : undefined,
    staleTime: 30_000,
  })
}

export function useVisit(id: number) {
  return useQuery({
    queryKey: ['visits', id],
    queryFn: () => getVisitById(id),
    staleTime: 0,
    // Always refetch when the visit detail screen mounts so closing and
    // reopening it shows the loading state and pulls fresh data from the API.
    refetchOnMount: 'always',
    enabled: !!id,
  })
}

/**
 * Every visit mutation **should** return the updated Visit (single source of
 * truth) — when it does we shove it straight into the React-Query cache so
 * screens re-render instantly without a network round-trip.
 *
 * Some form endpoints (e.g. morse-falls-risk-assessment) sometimes return
 * just the form section data instead of the full visit. In that case we fall
 * back to invalidating the visit query so it refetches the canonical state.
 */
function applyVisitUpdate(
  qc: ReturnType<typeof useQueryClient>,
  response: Visit | unknown,
  fallbackVisitId?: number,
) {
  const visit = response as Partial<Visit> | null | undefined
  if (visit && typeof visit === 'object' && visit.id != null) {
    qc.setQueryData(['visits', visit.id], visit as Visit)
    qc.invalidateQueries({ queryKey: ['visits'] })
    return
  }
  // Response wasn't a full visit — refetch instead.
  if (fallbackVisitId != null) {
    qc.invalidateQueries({ queryKey: ['visits', fallbackVisitId] })
  }
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

export function useSubmitMorseFallsRiskAssessment(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Omit<MorseFallsRiskAssessmentInput, 'visitId'>>({
    mutationFn: (input) => submitMorseFallsRiskAssessment({ visitId, ...input }),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

/**
 * Record a Yes (action=1) or No (action=0, with reason) for a single
 * dialysis-medication row. The response only echoes the action, so on success
 * we invalidate the parent visit query to pull the fresh `administered`
 * state for the row into the cache.
 */
export function useSubmitMedicationAdministration(visitId: number) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { medicationId: number | string; action: 0 | 1; reason?: string | null }>({
    mutationFn: (input) => submitMedicationAdministration(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits', visitId] })
      qc.invalidateQueries({ queryKey: ['visits'] })
    },
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
