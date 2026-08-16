import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOfflineInfiniteQuery } from './useOfflineInfiniteQuery'
import { useOfflineQuery } from './useOfflineQuery'
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
  submitConsentForHemodialysis,
  submitConsentForm,
  submitDoctorProgressNote,
  submitEnrollmentsChecklist,
  submitIncidentsForm,
  submitInventoryUsage,
  submitInventoryUsageMultiple,
  submitMedicationAdministration,
  submitMorseFallsRiskAssessment,
  submitNursingProgressNote,
  submitPatientAssessment,
  submitPatientResponsibility,
  submitReferral,
  submitRefusal,
  submitSariScreening,
  submitSocialAssessmentForm,
  submitSocialWorkerProgressNote,
  submitVisualTriageChecklist,
} from '../data/visit_repository'
import type { ConsentFormData } from '@/components/visits/visitForms/ConsentFormForm'
import type { PatientResponsibilityData } from '@/components/visits/visitForms/PatientResponsibilityForm'
import type { ConsentForHemodialysisData } from '@/components/visits/visitForms/ConsentForHemodialysisForm'
import type { EnrollmentsChecklistData } from '@/components/visits/visitForms/EnrollmentsChecklistForm'
import type { PatientAssessmentData } from '@/components/visits/visitForms/PatientAssessmentForm'
import type { InventoryUsageInput, InventoryUsageMultipleInput, Visit } from '../data/models/visit'
import type { DoctorProgressNoteInput } from '../data/models/doctorProgressNote'
import type { MorseFallsRiskAssessmentInput } from '../data/models/morseFallsRisk'
import type { ReferralInput } from '../data/models/referral'
import type { RefusalInput } from '../data/models/refusal'
import type { SariScreeningInput } from '../data/models/sariScreening'
import type { SocialWorkerLocation } from '../data/models/socialWorkerProgressNote'

const CACHE_24H = 24 * 60 * 60 * 1000

export function useVisits(date?: string, status?: string) {
  return useOfflineInfiniteQuery({
    queryKey: ['visits', date ?? null, status ?? null],
    queryFn: (pageParam) => getVisitsPage(VISITS_PER_PAGE, pageParam as number, date, status),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      try {
        if (!last) return undefined
        const hasMore = last.hasMore ?? false
        const currentPage = last.meta?.current_page ?? 1
        return hasMore ? currentPage + 1 : undefined
      } catch (error) {
        console.error('[useVisits] Error in getNextPageParam:', error)
        return undefined
      }
    },
    cacheTtl: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useVisit(id: number) {
  return useOfflineQuery({
    queryKey: ['visits', id],
    queryFn: () => {
      if (!id) throw new Error('Visit ID is required')
      return getVisitById(id)
    },
    cacheTtl: 2 * 60 * 1000,
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
    onSuccess: (response) => {
      applyVisitUpdate(qc, response, visitId)
      qc.invalidateQueries({ queryKey: ['patient-inventory'] })
    },
  })
}

export function useSubmitInventoryUsageMultiple(visitId: number) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, Omit<InventoryUsageMultipleInput, 'visitId'>>({
    mutationFn: (input) => submitInventoryUsageMultiple({ visitId, ...input }),
    onSuccess: (response) => {
      applyVisitUpdate(qc, response, visitId)
      qc.invalidateQueries({ queryKey: ['patient-inventory'] })
    },
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

// ─── Class C forms ───────────────────────────────────────────────────────

export function useSubmitConsentForm(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, ConsentFormData>({
    mutationFn: (data) => submitConsentForm(visitId, data as unknown as Record<string, unknown>),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

export function useSubmitPatientResponsibility(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, PatientResponsibilityData>({
    mutationFn: (data) => submitPatientResponsibility(visitId, data as unknown as Record<string, unknown>),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

function serializeConsentForHemodialysis(data: ConsentForHemodialysisData): Record<string, unknown> {
  return {
    hospital_en: data.en.hospital,
    hospital_ar: data.ar.hospital,
    doctor_name_en: data.en.doctorName,
    doctor_name_ar: data.ar.doctorName,
    patient_age_en: data.en.patientAge,
    patient_age_ar: data.ar.patientAge,
    consent_date_en: data.en.consentDate,
    consent_date_ar: data.ar.consentDate,
    person_giving_consent_en: data.en.personGivingConsent,
    person_giving_consent_ar: data.ar.personGivingConsent,
    witness_signature_signed_at: data.witness_signature_signed_at,
    witness_signature_signed_by: data.witness_signature_signed_by,
    witness_signature_ar_signed_at: data.witness_signature_ar_signed_at,
    witness_signature_ar_signed_by: data.witness_signature_ar_signed_by,
    person_consent_signature_signed_at: data.en.personConsentSignature.signedAt ?? null,
    person_consent_signature_signature_url: data.en.personConsentSignature.signatureUrl ?? data.en.personConsentSignature.dataUrl ?? null,
    person_consent_signature_ar_signed_at: data.ar.personConsentSignature.signedAt ?? null,
    person_consent_signature_ar_signature_url: data.ar.personConsentSignature.signatureUrl ?? data.ar.personConsentSignature.dataUrl ?? null,
  }
}

export function useSubmitConsentForHemodialysis(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, ConsentForHemodialysisData>({
    mutationFn: (data) => submitConsentForHemodialysis(visitId, serializeConsentForHemodialysis(data)),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

function serializeEnrollmentsChecklist(data: EnrollmentsChecklistData): Record<string, unknown> {
  return {
    appendixB: data.appendixB,
    appendixC: data.appendixC,
    demographics: data.demographics,
    overAllFeedback: data.overAllFeedback,
  }
}

export function useSubmitEnrollmentsChecklist(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, EnrollmentsChecklistData>({
    mutationFn: (data) => submitEnrollmentsChecklist(visitId, serializeEnrollmentsChecklist(data)),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}

function serializePatientAssessment(data: PatientAssessmentData): Record<string, unknown> {
  const rawMentalStatus = (data.assessment as Record<string, unknown>).mental_status
  const mentalStatus = typeof rawMentalStatus === 'string'
    ? rawMentalStatus.split(',').map((v) => v.trim()).filter(Boolean)
    : rawMentalStatus
  const rawContraptions = (data.medical_surgical_history as Record<string, unknown>).contraptions_equipment_g1
  const contraptionsEquipmentG1 = Array.isArray(rawContraptions) ? rawContraptions.join(',') : rawContraptions
  // The backend represents "Others" (g2) as an empty string on the wire —
  // the free-text `contraptions_equipment_g2_others` is what actually carries
  // the value. The UI keeps "Others" as the selected radio value so it stays
  // visibly selected; translate it to "" only at serialize time. Confirmed
  // via a live API capture: these 4 fields are nested under
  // `medical_surgical_history`.
  const contraptionsEquipmentG2 = data.medical_surgical_history.contraptions_equipment_g2 === 'Others'
    ? ''
    : data.medical_surgical_history.contraptions_equipment_g2
  return {
    ...data.flat,
    assessment: { ...data.assessment, mental_status: mentalStatus },
    referral: data.referral,
    social_hostory: data.social_hostory,
    patient_information: data.patient_information,
    medical_surgical_history: {
      ...data.medical_surgical_history,
      contraptions_equipment_g1: contraptionsEquipmentG1,
      contraptions_equipment_g2: contraptionsEquipmentG2,
    },
    surgical_history: data.surgical_history,
    assessment_signature_signed_at: data.assessment_signature_signed_at,
    assessment_signature_signed_by: data.assessment_signature_signed_by,
  }
}

export function useSubmitPatientAssessment(visitId: number) {
  const qc = useQueryClient()
  return useMutation<Visit, Error, PatientAssessmentData>({
    mutationFn: (data) => submitPatientAssessment(visitId, serializePatientAssessment(data)),
    onSuccess: (visit) => applyVisitUpdate(qc, visit, visitId),
  })
}
