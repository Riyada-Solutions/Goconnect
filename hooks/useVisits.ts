import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkoutVisit,
  checkoutWithoutSapVisit,
  closeVisit,
  endVisit,
  getVisitById,
  getVisitsPage,
  VISITS_PER_PAGE,
  saveProcedureTimes,
  reopenVisit,
  startVisit,
  submitAllergiesForm,
  submitBloodSugarForm,
  submitDoctorProgressNote,
  submitIncidentsForm,
  submitInventoryUsage,
  submitInventoryUsageMultiple,
  submitMedicationAdministration,
  submitMorseFallsRiskAssessment,
  submitNursingProgressNote,
  submitReferral,
  submitRefusal,
  submitSariScreening,
  submitSocialAssessmentForm,
  submitSocialWorkerProgressNote,
  submitVisualTriageChecklist,
} from '../data/visit_repository'
import type { InventoryUsageInput, InventoryUsageMultipleInput, Visit } from '../data/models/visit'
import type { DoctorProgressNoteInput } from '../data/models/doctorProgressNote'
import type { MorseFallsRiskAssessmentInput } from '../data/models/morseFallsRisk'
import type { ReferralInput } from '../data/models/referral'
import type { RefusalInput } from '../data/models/refusal'
import type { SariScreeningInput } from '../data/models/sariScreening'
import type { SocialWorkerLocation } from '../data/models/socialWorkerProgressNote'

const CACHE_24H = 24 * 60 * 60 * 1000

export function useVisits(date?: string) {
  return useInfiniteQuery({
    queryKey: ['visits', date ?? null],
    queryFn: ({ pageParam = 1 }) => getVisitsPage(VISITS_PER_PAGE, pageParam as number, date),
    initialPageParam: 1,
    getNextPageParam: (last) => last.hasMore ? last.meta.current_page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: CACHE_24H,
    networkMode: 'offlineFirst',
  })
}

export function useVisit(id: number) {
  return useQuery({
    queryKey: ['visits', id],
    queryFn: () => getVisitById(id),
    staleTime: 2 * 60 * 1000,
    gcTime: CACHE_24H,
    networkMode: 'offlineFirst',
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
    mutationFn: (input) => submitMedicationAdministration({ ...input, visitId }),
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
  return useMutation<unknown, Error, Omit<InventoryUsageInput, 'visitId'>>({
    mutationFn: (input) => submitInventoryUsage({ visitId, ...input }),
    onSuccess: (response) => applyVisitUpdate(qc, response, visitId),
  })
}

export function useSubmitInventoryUsageMultiple(visitId: number) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, Omit<InventoryUsageMultipleInput, 'visitId'>>({
    mutationFn: (input) => submitInventoryUsageMultiple({ visitId, ...input }),
    onSuccess: (response) => applyVisitUpdate(qc, response, visitId),
  })
}


function useVisitStatusMutation(
  fn: (id: number) => Promise<Visit>,
  visitId: number,
) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, void>({
    mutationFn: () => fn(visitId),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

export const useStartVisit = (visitId: number) =>
  useVisitStatusMutation(startVisit, visitId)
export const useEndVisit = (visitId: number) =>
  useVisitStatusMutation(endVisit, visitId)
export const useCheckoutVisit = (visitId: number) =>
  useVisitStatusMutation(checkoutVisit, visitId)
export const useCheckoutWithoutSapVisit = (visitId: number) =>
  useVisitStatusMutation(checkoutWithoutSapVisit, visitId)
export const useCloseVisit = (visitId: number) =>
  useVisitStatusMutation(closeVisit, visitId)
export const useReopenVisit = (visitId: number) =>
  useVisitStatusMutation(reopenVisit, visitId)

export function useSaveProcedureTimes(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, { startTime?: string; endTime?: string }>({
    mutationFn: (body) => saveProcedureTimes(visitId, body),
    onSuccess: (visit) => applyVisitUpdate(qc, visit),
  })
}

export function useSubmitAllergiesForm(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Parameters<typeof submitAllergiesForm>[1]>({
    mutationFn: (body) => submitAllergiesForm(visitId, body),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

export function useSubmitBloodSugarForm(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Parameters<typeof submitBloodSugarForm>[1]>({
    mutationFn: (body) => submitBloodSugarForm(visitId, body),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

export function useSubmitSocialAssessmentForm(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Parameters<typeof submitSocialAssessmentForm>[1]>({
    mutationFn: (body) => submitSocialAssessmentForm(visitId, body),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

export function useSubmitIncidentsForm(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Parameters<typeof submitIncidentsForm>[1]>({
    mutationFn: (body) => submitIncidentsForm(visitId, body),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

export function useSubmitVisualTriageChecklist(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, Parameters<typeof submitVisualTriageChecklist>[1]>({
    mutationFn: (body) => submitVisualTriageChecklist(visitId, body),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}
