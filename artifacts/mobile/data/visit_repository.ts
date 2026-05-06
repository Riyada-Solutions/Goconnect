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
import { parsePage, EMPTY_META } from './models/pagination'
import type { Page } from './models/pagination'
import type {
  FlowSheet,
  FlowSheetAccessInput,
  FlowSheetAlarmsTestInput,
  FlowSheetAnticoagulationInput,
  FlowSheetCarSectionInput,
  FlowSheetCar,
  FlowSheetDialysateSectionInput,
  FlowSheetDialysate,
  FlowSheetDialysisParam,
  FlowSheetDialysisParamsInput,
  FlowSheetFallRiskInput,
  FlowSheetIntakeOutputInput,
  FlowSheetMachinesInput,
  FlowSheetMedicationAdmin,
  FlowSheetMedicationsInput,
  FlowSheetMobilePostTx,
  FlowSheetMobileVitals,
  FlowSheetNursingAction,
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

export const VISITS_PER_PAGE = 20

export async function getVisitsPage(
  perPage = VISITS_PER_PAGE,
  page = 1,
  date?: string,
): Promise<Page<Visit>> {
  if (ENV.USE_MOCK_DATA) {
    const items = await mockGetVisits()
    return { items, meta: { ...EMPTY_META, current_page: page, per_page: perPage, total: items.length }, hasMore: false }
  }
  const params: Record<string, unknown> = { per_page: perPage, page }
  if (date) params.date = date
  const res = await apiClient.get('/visits', { params })
  return parsePage<Visit>(res.data, page, perPage)
}

export async function getVisitById(
  id: number | string,
): Promise<Visit | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetVisitById(Number(id))
  const res = await apiClient.get(`/visits/${id}`)
  const raw = res.data?.data ?? res.data
  if (!raw) return undefined
  return { ...raw, flowSheet: mapFlowSheetFromApi(raw) }
}

/**
 * Maps the actual backend response to the canonical `FlowSheet` model.
 *
 * The backend currently stores the flow sheet inside `forms.flowsheet[0].value`
 * with snake_case keys. If the backend is already returning a populated
 * top-level `flowSheet` object (camelCase, as documented in §8.2), that is
 * used directly and the mapping is skipped.
 */
function mapFlowSheetFromApi(raw: any): FlowSheet | undefined {
  // If the backend already returns the documented camelCase shape, use it.
  const direct = raw?.flowSheet
  if (direct && Object.keys(direct).length > 1) return direct as FlowSheet

  // Otherwise map from forms.flowsheet[0] (snake_case backend format).
  const fsArr = Array.isArray(raw?.forms?.flowsheet) ? raw.forms.flowsheet : null
  if (!fsArr || fsArr.length === 0) return undefined

  const entry = fsArr[0]
  const v: Record<string, any> = entry?.value ?? {}
  const visitId = Number(raw?.id)

  // ── Pre-treatment vitals ──────────────────────────────────────────────────
  const ptv = v.pre_treatment_vital ?? {}
  const vitals: FlowSheetMobileVitals = {
    height:      String(ptv.height ?? ''),
    preWeight:   String(ptv.weight ?? ptv.pre_weight ?? ''),
    dryWeight:   String(ptv.weight_dry ?? ptv.dry_weight ?? ''),
    ufGoal:      String(ptv.uf_goal ?? ''),
    bpSystolic:  String(ptv.bp_systolic ?? ''),
    bpDiastolic: String(ptv.bp_diastolic ?? ''),
    temperature: String(ptv.temp ?? ptv.temperature ?? ''),
    spo2:        String(ptv.spo2 ?? ''),
    hr:          String(ptv.pr_value ?? ptv.hr ?? ptv.pulse ?? ''),
    rr:          String(ptv.rr ?? ''),
    rbs:         String(ptv.rbs ?? ''),
  }
  const hasVitals = Object.values(vitals).some(x => x !== '')

  // ── Pain assessment ───────────────────────────────────────────────────────
  const pa = v.pain_assessment ?? {}

  // ── Fall risk ─────────────────────────────────────────────────────────────
  const fra = v.fall_risk_assessment ?? {}

  // ── Alarms test ───────────────────────────────────────────────────────────
  const at = v.alarms_test ?? {}

  // ── CAR (ff%, dialyzer, temp) — may be its own key or inside alarms_test ──
  const carRaw = v.car ?? {}
  const carFfPct = carRaw.ff_percent ?? at.ff_percent
  const car: FlowSheetCar | undefined =
    (carFfPct || carRaw.dialyzer || at.dialyzer || carRaw.temp || at.temp)
      ? {
          ffPercent: String(carFfPct ?? ''),
          dialyzer:  String(carRaw.dialyzer ?? at.dialyzer ?? ''),
          temp:      String(carRaw.temp ?? at.temp ?? ''),
        }
      : undefined

  // ── Dialysate ─────────────────────────────────────────────────────────────
  const dsRaw = v.dialysate ?? {}
  const dialysate: FlowSheetDialysate | undefined =
    (dsRaw.na || dsRaw.hco3 || dsRaw.k || dsRaw.glucose || at.k || at.glucose)
      ? {
          na:      String(dsRaw.na ?? at.na ?? ''),
          hco3:    String(dsRaw.hco3 ?? at.hco3 ?? ''),
          k:       String(dsRaw.k ?? at.k ?? ''),
          glucose: String(dsRaw.glucose ?? at.glucose ?? ''),
        }
      : undefined

  // ── Dialysis parameters ───────────────────────────────────────────────────
  const hd = v.hemodialysis ?? {}
  const rawRows: any[] = hd.dialysis ?? hd.dialysis_parameters ?? []
  const dialysisParams: FlowSheetDialysisParam[] = rawRows.map(row => ({
    time:          String(row.time ?? ''),
    systolic:      String(row.blood_pressure_systolic ?? row.systolic ?? ''),
    diastolic:     String(row.blood_pressure_diastolic ?? row.diastolic ?? ''),
    site:          String(row.site ?? ''),
    pulse:         String(row.pulse ?? ''),
    dialysateRate: String(row.dialysate_rate ?? row.dialysateRate ?? ''),
    uf:            String(row.uf_rate ?? row.uf ?? ''),
    bfr:           String(row.bfr ?? ''),
    dialysateVol:  String(row.dialysate_volume ?? row.dialysateVol ?? ''),
    ufVol:         String(row.uf_volume ?? row.ufVol ?? ''),
    venous:        String(row.venous ?? ''),
    effluent:      String(row.effluent ?? ''),
    access:        String(row.access ?? ''),
    alarms:        String(row.alarms ?? ''),
    initials:      String(row.initials ?? ''),
  }))

  // ── Nursing actions ───────────────────────────────────────────────────────
  const naRaw = v.nursing_action ?? v.nursing_actions ?? {}
  const nursingActions: FlowSheetNursingAction[] | undefined = Array.isArray(naRaw)
    ? naRaw
    : (Array.isArray(naRaw.nursingActions) ? naRaw.nursingActions : undefined)

  // ── Post treatment ────────────────────────────────────────────────────────
  const post = v.post_assessment ?? {}
  const hasPost = Object.keys(post).length > 0
  const postTx: FlowSheetMobilePostTx | undefined = hasPost
    ? {
        bpSystolic:          String(post.bp_sitting_systolic ?? ''),
        bpDiastolic:         String(post.bp_sitting_diastolic ?? ''),
        bpSite:              String(post.bp_sitting_site ?? ''),
        pulse:               String(post.pulse ?? ''),
        temp:                String(post.temp ?? ''),
        tempMethod:          String(post.temp_method ?? ''),
        spo2:                String(post.spo2 ?? ''),
        rr:                  String(post.rr ?? ''),
        rbs:                 String(post.rbs ?? ''),
        weight:              String(post.weight ?? ''),
        txHr:                String(post.tx_time_hr ?? ''),
        dialysateL:          String(post.dialysate_l ?? ''),
        uf:                  String(post.uf ?? ''),
        blp:                 String(post.blp ?? ''),
        ufNet:               String(post.uf_net ?? ''),
        catheterLock:        String(post.catheter_lock ?? ''),
        arterialAccess:      String(post.arterial_access ?? ''),
        venousAccess:        String(post.venous_access ?? ''),
        machineDisinfected:  post.machine_disinfected === 'yes' || post.machine_disinfected === true,
        accessProblems:      String(post.access_problems ?? ''),
        nonMedicalIncidence: String(post.non_medical_incidence ?? ''),
      }
    : undefined

  // ── Medication admin ──────────────────────────────────────────────────────
  const dm = v.dialysis_medications ?? {}
  const medAdmin: Record<number, FlowSheetMedicationAdmin> | undefined =
    dm && typeof dm === 'object' && !Array.isArray(dm) && Object.keys(dm).length > 0
      ? (dm.medAdmin ?? dm.med_admin ?? dm.medications)
      : undefined

  return {
    visitId,
    ...(hasVitals ? { vitals } : {}),
    bpSite:     ptv.bp_site ?? ptv.bpSite ?? undefined,
    method:     ptv.temp_method ?? ptv.method ?? undefined,
    machine:    (typeof v.machines === 'string' ? v.machines : v.machines?.machine) ?? undefined,
    pain:       pa.pain ?? undefined,
    painDetails: pa.painDetails ?? pa.pain_details ?? undefined,
    fallRisk:    fra.fallRisk ?? fra.fall_risk ?? undefined,
    highFallRisk: fra.highFallRisk ?? fra.high_fall_risk ?? undefined,
    morseValues: fra.morseValues ?? fra.morse_values ?? undefined,
    morseTotal:  fra.morseTotal ?? fra.morse_total ?? undefined,
    outsideDialysis:
      v.outside_dialysis === '1' || v.outside_dialysis === true || v.outside_dialysis === 1,
    alarmsTest:
      at.passed === '1' || at.passed === true || at.alarmsTest === true,
    intake:  v.intake_output?.intake ?? undefined,
    output:  v.intake_output?.output ?? undefined,
    car,
    dialysate,
    access:
      typeof v.access === 'string'
        ? v.access
        : (v.access?.access ?? undefined),
    anticoagType:
      typeof v.anticoagulation === 'string'
        ? v.anticoagulation
        : (v.anticoagulation?.anticoagType ?? undefined),
    dialysisParams: dialysisParams.length > 0 ? dialysisParams : undefined,
    medAdmin,
    nursingActions,
    postTx,
    submittedAt: entry?.updatedAt ?? entry?.updated_at ?? undefined,
  }
}

// ─── Visit status transitions ───────────────────────────────────────────────
//
// Each transition returns the updated Visit so the UI can refresh its cache.

const unwrapVisit = (raw: any): Visit => raw?.data ?? raw

async function patchMockVisit(
  id: number | string,
  status: Visit['status'],
): Promise<Visit> {
  await new Promise((r) => setTimeout(r, 300))
  const current = await mockGetVisitById(Number(id))
  if (!current) throw new Error('Visit not found')
  ;(current as any).status = status
  return current
}

export async function startVisit(visitId: number | string): Promise<Visit> {
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
  visitId: number | string,
  body: { startTime?: string; endTime?: string },
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'in_progress')
  const res = await apiClient.post(`/visits/${visitId}/procedure-times`, body)
  return unwrapVisit(res.data)
}

export async function endVisit(visitId: number | string): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'completed')
  const res = await apiClient.post(`/visits/${visitId}/end`)
  return unwrapVisit(res.data)
}

/**
 * Slug for each individual flow-sheet section. The mobile UI still submits
 * sections one at a time so the backend can persist partial work; we map each
 * slug onto the corresponding key inside the unified `flowsheet` form.
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

// Map FE section slug → top-level snake_case key inside the flowsheet form
// `value`. Backend is a Class-A (shallow merge) endpoint, so we send the
// section under its key and untouched keys stay intact.
const FLOWSHEET_SECTION_KEY: Record<FlowSheetSection, string> = {
  'outside-dialysis': 'outside_dialysis',
  'pre-treatment-vitals': 'pre_treatment_vital',
  'machines': 'machines',
  'pain-assessment': 'pain_assessment',
  'fall-risk': 'fall_risk_assessment',
  'nursing-actions': 'nursing_action',
  'dialysis-parameters': 'hemodialysis',
  'alarms-test': 'alarms_test',
  'intake-output': 'intake_output',
  'car': 'car',
  'access': 'access',
  'dialysate': 'dialysate',
  'anticoagulation': 'anticoagulation',
  'medications': 'dialysis_medications',
  'post-treatment': 'post_assessment',
}

/**
 * Generic per-section save. Posts to the unified `POST /visits/{id}/forms/flowsheet`
 * with the section payload under its top-level key. Returns the **full updated
 * Visit** (single source of truth).
 */
export async function submitFlowSheetSection(
  visitId: number | string,
  section: FlowSheetSection,
  body: unknown,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'in_progress')
  const key = FLOWSHEET_SECTION_KEY[section]
  const res = await apiClient.post(
    `/visits/${visitId}/forms/flowsheet`,
    { [key]: body },
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
  visitId: number | string,
  body: FlowSheetOutsideDialysisInput,
) => submitFlowSheetSection(visitId, 'outside-dialysis', body)

export const submitFlowSheetVitals = (
  visitId: number | string,
  body: FlowSheetVitalsSectionInput,
) => submitFlowSheetSection(visitId, 'pre-treatment-vitals', body)

export const submitFlowSheetMachines = (
  visitId: number | string,
  body: FlowSheetMachinesInput,
) => submitFlowSheetSection(visitId, 'machines', body)

export const submitFlowSheetPain = (
  visitId: number | string,
  body: FlowSheetPainSectionInput,
) => submitFlowSheetSection(visitId, 'pain-assessment', body)

export const submitFlowSheetFallRisk = (
  visitId: number | string,
  body: FlowSheetFallRiskInput,
) => submitFlowSheetSection(visitId, 'fall-risk', body)

export const submitFlowSheetNursingActions = (
  visitId: number | string,
  body: FlowSheetNursingActionsInput,
) => submitFlowSheetSection(visitId, 'nursing-actions', body)

export const submitFlowSheetDialysisParams = (
  visitId: number | string,
  body: FlowSheetDialysisParamsInput,
) => submitFlowSheetSection(visitId, 'dialysis-parameters', body)

export const submitFlowSheetAlarmsTest = (
  visitId: number | string,
  body: FlowSheetAlarmsTestInput,
) => submitFlowSheetSection(visitId, 'alarms-test', body)

export const submitFlowSheetIntakeOutput = (
  visitId: number | string,
  body: FlowSheetIntakeOutputInput,
) => submitFlowSheetSection(visitId, 'intake-output', body)

export const submitFlowSheetCar = (
  visitId: number | string,
  body: FlowSheetCarSectionInput,
) => submitFlowSheetSection(visitId, 'car', body)

export const submitFlowSheetAccess = (
  visitId: number | string,
  body: FlowSheetAccessInput,
) => submitFlowSheetSection(visitId, 'access', body)

export const submitFlowSheetDialysate = (
  visitId: number | string,
  body: FlowSheetDialysateSectionInput,
) => submitFlowSheetSection(visitId, 'dialysate', body)

export const submitFlowSheetAnticoagulation = (
  visitId: number | string,
  body: FlowSheetAnticoagulationInput,
) => submitFlowSheetSection(visitId, 'anticoagulation', body)

export const submitFlowSheetMedications = (
  visitId: number | string,
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

function serializePostTx(pt: FlowSheetMobilePostTx) {
  return {
    bp_sitting_systolic:  pt.bpSystolic,
    bp_sitting_diastolic: pt.bpDiastolic,
    bp_sitting_site:      pt.bpSite,
    pulse:                pt.pulse,
    temp:                 pt.temp,
    temp_method:          pt.tempMethod,
    spo2:                 pt.spo2,
    rr:                   pt.rr,
    rbs:                  pt.rbs,
    weight:               pt.weight,
    tx_time_hr:           pt.txHr,
    dialysate_l:          pt.dialysateL,
    uf:                   pt.uf,
    blp:                  pt.blp,
    uf_net:               pt.ufNet,
    catheter_lock:        pt.catheterLock,
    arterial_access:      pt.arterialAccess,
    venous_access:        pt.venousAccess,
    machine_disinfected:  pt.machineDisinfected ? 'yes' : 'no',
    access_problems:      pt.accessProblems,
    non_medical_incidence: pt.nonMedicalIncidence,
  }
}

/**
 * Post-treatment save. Uses multipart/form-data only when at least one
 * signature PNG is present; falls back to plain JSON otherwise so the clinical
 * data is persisted even when the backend media-upload table is unavailable.
 */
export async function submitFlowSheetPostTreatment(
  visitId: number | string,
  body: FlowSheetPostTreatmentInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'in_progress')

  const hasPatientSig = !!body.patientSignature?.dataUrl
  const hasNurseSig   = !!body.nurseSignature?.dataUrl
  const needsMultipart = hasPatientSig || hasNurseSig

  const postPayload = { post_assessment: serializePostTx(body.postTx) }

  if (!needsMultipart) {
    const res = await apiClient.post(
      `/visits/${visitId}/forms/flowsheet`,
      postPayload,
    )
    return unwrapVisit(res.data)
  }

  const fd = new FormData()
  fd.append('data', JSON.stringify(postPayload))

  if (hasPatientSig) {
    fd.append('patient_signature', dataUrlToFile(body.patientSignature!.dataUrl, 'patient_signature'))
    if (body.patientSignature!.signedAt) {
      fd.append('patient_signature_signed_at', body.patientSignature!.signedAt)
    }
  }
  if (hasNurseSig) {
    fd.append('nurse_signature', dataUrlToFile(body.nurseSignature!.dataUrl, 'nurse_signature'))
    if (body.nurseSignature!.signedAt) {
      fd.append('nurse_signature_signed_at', body.nurseSignature!.signedAt)
    }
  }

  const res = await apiClient.post(
    `/visits/${visitId}/forms/flowsheet`,
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
    `/visits/${payload.visitId}/forms/nursing-progress-note`,
    { notes: payload.note },
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
    `/visits/${payload.visitId}/forms/progress-notes`,
    {
      type: 'in_visit',
      notes: payload.note,
      addenda: payload.isAddendum
        ? [{ parentNoteId: payload.parentNoteId, notes: payload.note }]
        : [],
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
    `/visits/${payload.visitId}/forms/sari_screening`,
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
    `/visits/${payload.visitId}/forms/refusal`,
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
  const { visitId, attachmentUri, attachmentName, printOptions, ...rest } = payload

  // Flat text fields — sent individually, no 'data' JSON wrapper.
  Object.entries(rest).forEach(([key, val]) => {
    if (val !== undefined && val !== null) fd.append(key, String(val))
  })
  if (printOptions !== undefined) {
    fd.append('printOptions', JSON.stringify(printOptions))
  }

  if (attachmentUri) {
    const name = attachmentName ?? 'attachment'
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
    `/visits/${visitId}/forms/referral`,
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
    `/visits/${payload.visitId}/forms/progress-notes`,
    {
      type: payload.location === 'on_call' ? 'outside_visit' : 'in_visit',
      notes: payload.note,
      addenda: [],
    },
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
  const res = await apiClient.post(
    `/visits/${visitId}/forms/inventory_usage`,
    body,
  )
  return unwrapVisit(res.data)
}
