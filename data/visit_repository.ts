import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import {
  mockGetVisits,
  mockGetVisitById,
  mockSubmitNursingProgressNote,
  mockSubmitSocialWorkerProgressNote,
  mockSubmitReferral,
  mockSubmitDoctorProgressNote,
  mockSubmitRefusal,
  mockSubmitSariScreening,
} from './mock/visits_mock'
import type { Visit, InventoryUsageInput } from './models/visit'
import type {
  FlowSheetAccessInput,
  FlowSheetAlarmsTestInput,
  FlowSheetAnticoagulationInput,
  FlowSheetCarSectionInput,
  FlowSheetDialysateSectionInput,
  FlowSheetDialysisParamsInput,
  FlowSheetFallRiskInput,
  FlowSheetIntakeOutputInput,
  FlowSheetMachinesInput,
  FlowSheetMedicationsInput,
  FlowSheetNursingActionsInput,
  FlowSheetOutsideDialysisInput,
  FlowSheetPainSectionInput,
  FlowSheetPostTreatmentInput,
  FlowSheetVitalsSectionInput,
} from './models/flowSheet'
import type { NursingProgressNoteInput } from './models/nursingProgressNote'
import type { SocialWorkerProgressNoteInput } from './models/socialWorkerProgressNote'
import type { ReferralInput } from './models/referral'
import type { DoctorProgressNoteInput } from './models/doctorProgressNote'
import type { RefusalInput } from './models/refusal'
import type { SariScreeningInput } from './models/sariScreening'

export async function getVisits(): Promise<Visit[]> {
  if (ENV.USE_MOCK_DATA) return mockGetVisits()
  const { data } = await apiClient.get<Visit[]>('/visits')
  return data
}

export async function getVisitById(id: number): Promise<Visit | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetVisitById(id)
  const { data } = await apiClient.get<Visit>(`/visits/${id}`)
  return data
}

// ─── Visit status transitions ───────────────────────────────────────────────
//
// Each transition returns the updated Visit so the UI can refresh its cache.

const unwrapVisit = (raw: any): Visit => raw?.data ?? raw

async function patchMockVisit(
  id: number,
  status: Visit['status'],
): Promise<Visit> {
  await new Promise((r) => setTimeout(r, 300))
  const current = await mockGetVisitById(id)
  if (!current) throw new Error('Visit not found')
  ;(current as any).status = status
  return current
}

export async function startVisit(visitId: number): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'in_progress')
  const res = await apiClient.post(`/visits/${visitId}/start`)
  return unwrapVisit(res.data)
}

/**
 * Save the (manually edited) procedure start/end clock times. Used by the
 * "Save procedure times" button in the visit detail header. Returns the
 * full updated Visit.
 */
export async function saveProcedureTimes(
  visitId: number,
  body: { startTime?: string; endTime?: string },
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'in_progress')
  const res = await apiClient.post(`/visits/${visitId}/procedure-times`, body)
  return unwrapVisit(res.data)
}

export async function endVisit(visitId: number): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'completed')
  const res = await apiClient.post(`/visits/${visitId}/end`)
  return unwrapVisit(res.data)
}

/**
 * Slug for each individual flow-sheet section. The mobile app submits each
 * collapsible section separately so the backend can persist partial work.
 */
export type FlowSheetSection =
  | 'outside-dialysis'
  | 'pre-treatment-vitals'
  | 'machines'
  | 'pain-assessment'
  | 'fall-risk'
  | 'nursing-actions'
  | 'dialysis-parameters'
  | 'alarms-test'
  | 'intake-output'
  | 'car'
  | 'access'
  | 'dialysate'
  | 'anticoagulation'
  | 'medications'
  | 'post-treatment'

/**
 * Generic per-section save. Posts the section payload to
 * `POST /visits/{visitId}/flow-sheet/{section}` and returns the **full
 * updated Visit** (single source of truth). Each section has its own
 * permission rule (see [data/models/rules.ts]).
 */
export async function submitFlowSheetSection(
  visitId: number,
  section: FlowSheetSection,
  body: unknown,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'in_progress')
  const res = await apiClient.post(
    `/visits/${visitId}/flow-sheet/${section}`,
    body,
  )
  return unwrapVisit(res.data)
}

// ─── Typed per-section wrappers ─────────────────────────────────────────────
//
// Thin typed wrappers around `submitFlowSheetSection` so each section's
// payload shape is enforced at the call site. Every input may carry an
// optional `signature` (or `patientSignature`/`nurseSignature` for
// post-treatment) — when present the signature travels with that section.

export const submitFlowSheetOutsideDialysis = (
  visitId: number,
  body: FlowSheetOutsideDialysisInput,
) => submitFlowSheetSection(visitId, 'outside-dialysis', body)

export const submitFlowSheetVitals = (
  visitId: number,
  body: FlowSheetVitalsSectionInput,
) => submitFlowSheetSection(visitId, 'pre-treatment-vitals', body)

export const submitFlowSheetMachines = (
  visitId: number,
  body: FlowSheetMachinesInput,
) => submitFlowSheetSection(visitId, 'machines', body)

export const submitFlowSheetPain = (
  visitId: number,
  body: FlowSheetPainSectionInput,
) => submitFlowSheetSection(visitId, 'pain-assessment', body)

export const submitFlowSheetFallRisk = (
  visitId: number,
  body: FlowSheetFallRiskInput,
) => submitFlowSheetSection(visitId, 'fall-risk', body)

export const submitFlowSheetNursingActions = (
  visitId: number,
  body: FlowSheetNursingActionsInput,
) => submitFlowSheetSection(visitId, 'nursing-actions', body)

export const submitFlowSheetDialysisParams = (
  visitId: number,
  body: FlowSheetDialysisParamsInput,
) => submitFlowSheetSection(visitId, 'dialysis-parameters', body)

export const submitFlowSheetAlarmsTest = (
  visitId: number,
  body: FlowSheetAlarmsTestInput,
) => submitFlowSheetSection(visitId, 'alarms-test', body)

export const submitFlowSheetIntakeOutput = (
  visitId: number,
  body: FlowSheetIntakeOutputInput,
) => submitFlowSheetSection(visitId, 'intake-output', body)

export const submitFlowSheetCar = (
  visitId: number,
  body: FlowSheetCarSectionInput,
) => submitFlowSheetSection(visitId, 'car', body)

export const submitFlowSheetAccess = (
  visitId: number,
  body: FlowSheetAccessInput,
) => submitFlowSheetSection(visitId, 'access', body)

export const submitFlowSheetDialysate = (
  visitId: number,
  body: FlowSheetDialysateSectionInput,
) => submitFlowSheetSection(visitId, 'dialysate', body)

export const submitFlowSheetAnticoagulation = (
  visitId: number,
  body: FlowSheetAnticoagulationInput,
) => submitFlowSheetSection(visitId, 'anticoagulation', body)

export const submitFlowSheetMedications = (
  visitId: number,
  body: FlowSheetMedicationsInput,
) => submitFlowSheetSection(visitId, 'medications', body)

/**
 * Build a React-Native FormData "file" reference from a base64 data-URL
 * (e.g. `data:image/png;base64,...`). RN's FormData treats `{ uri, name, type }`
 * as a file part; the `uri` may be a data: URI on iOS/Android.
 */
function dataUrlToFile(dataUrl: string, name: string) {
  return {
    uri: dataUrl,
    name: `${name}.png`,
    type: 'image/png',
  } as unknown as Blob
}

/**
 * Post-treatment save uses **multipart/form-data** so signatures travel as
 * actual PNG files (not base64 strings inside JSON). The text payload goes in
 * a `data` field as a JSON string; signatures go in `patient_signature` /
 * `nurse_signature` file fields when present.
 */
export async function submitFlowSheetPostTreatment(
  visitId: number,
  body: FlowSheetPostTreatmentInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'in_progress')

  const fd = new FormData()
  // The non-image fields ride along as a single JSON blob to keep parsing simple.
  fd.append('data', JSON.stringify({ postTx: body.postTx }))

  if (body.patientSignature?.dataUrl) {
    fd.append(
      'patient_signature',
      dataUrlToFile(body.patientSignature.dataUrl, 'patient_signature'),
    )
    if (body.patientSignature.signedAt) {
      fd.append('patient_signature_signed_at', body.patientSignature.signedAt)
    }
  }
  if (body.nurseSignature?.dataUrl) {
    fd.append(
      'nurse_signature',
      dataUrlToFile(body.nurseSignature.dataUrl, 'nurse_signature'),
    )
    if (body.nurseSignature.signedAt) {
      fd.append('nurse_signature_signed_at', body.nurseSignature.signedAt)
    }
  }

  const res = await apiClient.post(
    `/visits/${visitId}/flow-sheet/post-treatment`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrapVisit(res.data)
}

export async function submitNursingProgressNote(
  payload: NursingProgressNoteInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitNursingProgressNote(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }
  const res = await apiClient.post(
    `/visits/${payload.visitId}/nursing-progress-notes`,
    { note: payload.note },
  )
  return unwrapVisit(res.data)
}

export async function submitDoctorProgressNote(
  payload: DoctorProgressNoteInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitDoctorProgressNote(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }
  const res = await apiClient.post(
    `/visits/${payload.visitId}/doctor-progress-notes`,
    {
      note: payload.note,
      isAddendum: payload.isAddendum,
      parentNoteId: payload.parentNoteId,
    },
  )
  return unwrapVisit(res.data)
}

export async function submitSariScreening(
  payload: SariScreeningInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitSariScreening(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }
  const res = await apiClient.post(
    `/visits/${payload.visitId}/sari-screenings`,
    payload,
  )
  return unwrapVisit(res.data)
}

/**
 * Refusal save uses **multipart/form-data** so each party's signature uploads
 * as a real PNG file (not base64 inside JSON). The text payload (types,
 * reason, risks, party metadata) goes in a single `data` JSON field; the four
 * signature files come on `witness_signature` / `relative_signature` /
 * `doctor_signature` / `interpreter_signature`.
 */
export async function submitRefusal(payload: RefusalInput): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitRefusal(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }

  const fd = new FormData()

  // Strip the inline base64 data so the JSON part stays small; the bytes ride
  // along as files instead.
  const stripSig = <T extends { signatureData?: string }>(p: T) => {
    const { signatureData: _omit, ...rest } = p
    return rest
  }

  fd.append(
    'data',
    JSON.stringify({
      types: payload.types,
      reason: payload.reason,
      risks: payload.risks,
      witness: stripSig(payload.witness),
      unableToSignReason: payload.unableToSignReason,
      relative: stripSig(payload.relative),
      doctor: stripSig(payload.doctor),
      interpreter: stripSig(payload.interpreter),
    }),
  )

  const attachSig = (key: string, party: { signed: boolean; signatureData?: string }) => {
    if (party.signed && party.signatureData) {
      fd.append(key, dataUrlToFile(party.signatureData, key))
    }
  }
  attachSig('witness_signature', payload.witness)
  attachSig('relative_signature', payload.relative)
  attachSig('doctor_signature', payload.doctor)
  attachSig('interpreter_signature', payload.interpreter)

  const res = await apiClient.post(
    `/visits/${payload.visitId}/refusals`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrapVisit(res.data)
}

/**
 * Referral save uses **multipart/form-data** so the optional attachment
 * (image / PDF picked by the nurse) uploads as a real file. The text payload
 * goes in a single `data` JSON field; the file goes on `attachment`.
 */
export async function submitReferral(payload: ReferralInput): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitReferral(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }

  const fd = new FormData()
  const { attachmentUri, attachmentName, ...rest } = payload
  fd.append('data', JSON.stringify(rest))

  if (attachmentUri) {
    const name = attachmentName ?? 'attachment'
    // Best-effort MIME inference; default to image/jpeg.
    const lower = name.toLowerCase()
    const type =
      lower.endsWith('.png') ? 'image/png' :
      lower.endsWith('.pdf') ? 'application/pdf' :
      lower.endsWith('.heic') ? 'image/heic' : 'image/jpeg'
    fd.append('attachment', {
      uri: attachmentUri,
      name,
      type,
    } as unknown as Blob)
  }

  const res = await apiClient.post(
    `/visits/${payload.visitId}/referrals`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrapVisit(res.data)
}

export async function submitSocialWorkerProgressNote(
  payload: SocialWorkerProgressNoteInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitSocialWorkerProgressNote(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }
  const res = await apiClient.post(
    `/visits/${payload.visitId}/social-worker-progress-notes`,
    { note: payload.note, location: payload.location },
  )
  return unwrapVisit(res.data)
}

/**
 * Record one inventory item consumed during this visit. Backend deducts the
 * `quantity` from the patient's available stock and returns the **updated
 * Visit** (single source of truth).
 */
export async function submitInventoryUsage(
  payload: InventoryUsageInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 200))
    return patchMockVisit(payload.visitId, 'in_progress')
  }
  const { visitId, ...body } = payload
  const res = await apiClient.post(`/visits/${visitId}/inventory-usage`, body)
  return unwrapVisit(res.data)
}
