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
  FlowSheetDialysisMedication,
  FlowSheetDialysisParam,
  FlowSheetDialysisParamsInput,
  FlowSheetFallRiskInput,
  FlowSheetIntakeOutputInput,
  FlowSheetMachinesInput,
  FlowSheetMedicationsInput,
  FlowSheetMobilePostTx,
  FlowSheetMobileVitals,
  FlowSheetNursingAction,
  FlowSheetNursingActionsInput,
  FlowSheetOutsideDialysisInput,
  FlowSheetPainDetails,
  FlowSheetPainSectionInput,
  FlowSheetPostAssessment,
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
 * Maps `GET /visits/{id}` response into the canonical `FlowSheet` model.
 *
 * The backend returns a flat `flowSheet` object with snake_case section keys
 * (alarms_test, hemodialysis, post_assessment, outside_dialysis,
 * pre_treatment_vital, dialysis_medications, …). Each section is optional and
 * may be missing when the nurse hasn't saved it yet.
 */
function mapFlowSheetFromApi(raw: any): FlowSheet | undefined {
  const v: Record<string, any> | undefined =
    raw?.flowSheet && typeof raw.flowSheet === 'object' ? raw.flowSheet : undefined
  if (!v) return undefined

  const sectionKeys = Object.keys(v).filter(k => k !== 'visitId')
  if (sectionKeys.length === 0) return undefined

  const visitId = Number(raw?.id ?? v.visitId)

  // ── Pre-treatment vitals ──────────────────────────────────────────────────
  const ptv = v.pre_treatment_vital ?? {}
  const vitals: FlowSheetMobileVitals = {
    height:      String(ptv.height ?? ''),
    preWeight:   String(ptv.weight ?? ''),
    dryWeight:   String(ptv.weight_dry ?? ''),
    ufGoal:      String(ptv.uf_goal ?? ''),
    bpSystolic:  String(ptv.bp_systolic ?? ''),
    bpDiastolic: String(ptv.bp_diastolic ?? ''),
    temperature: String(ptv.temp ?? ''),
    spo2:        String(ptv.spo2 ?? ''),
    hr:          String(ptv.pr_value ?? ''),
    rr:          String(ptv.rr ?? ''),
    rbs:         String(ptv.rbs ?? ''),
    bmi:         ptv.bmi != null ? String(ptv.bmi) : undefined,
    bmiCategory: ptv.bmi_category ?? undefined,
    prSite:      ptv.pr ?? undefined,
  }
  const hasVitals = Object.values(vitals).some(x => x !== '' && x !== undefined)

  // ── Pain assessment (flat snake_case structure) ───────────────────────────
  const pa = v.pain_assessment ?? {}
  const hasPain = Object.keys(pa).length > 0
  const painDetails: FlowSheetPainDetails | undefined = hasPain
    ? {
        toolUsed:    String(pa.pain_present_tool_used ?? ''),
        location:    String(pa.location ?? ''),
        frequency:   String(pa.frequency ?? ''),
        radiatingTo: String(pa.radiating ?? ''),
        painType:    String(pa.type ?? ''),
        occurs:      String(pa.occurs ?? ''),
        ambulating:  String(pa.ambulating ?? ''),
        resting:     String(pa.resting ?? ''),
        eating:      String(pa.eating ?? ''),
        relievedBy:  String(pa.relieved ?? ''),
        worsensBy:   String(pa.worsens ?? ''),
      }
    : undefined

  // ── Fall risk (score / high_risk shape) ───────────────────────────────────
  const fra = v.fall_risk_assessment ?? {}
  const fallRisk: string | undefined    = fra.score != null ? String(fra.score) : undefined
  const highFallRisk: boolean | undefined =
    fra.high_risk != null ? (fra.high_risk === '1' || fra.high_risk === true || fra.high_risk === 1) : undefined

  // ── Alarms test ───────────────────────────────────────────────────────────
  const at = v.alarms_test ?? {}

  // ── CAR (ff%, dialyzer, temp) ─────────────────────────────────────────────
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
    (dsRaw.na || dsRaw.hco3 || dsRaw.k || dsRaw.glucose || at.k || at.na || at.hco3 || at.glucose)
      ? {
          na:      String(dsRaw.na ?? at.na ?? ''),
          hco3:    String(dsRaw.hco3 ?? at.hco3 ?? ''),
          k:       String(dsRaw.k ?? at.k ?? ''),
          glucose: String(dsRaw.glucose ?? at.glucose ?? ''),
        }
      : undefined

  // ── Access ────────────────────────────────────────────────────────────────
  const access: string | undefined =
    typeof v.access === 'string' ? v.access
    : v.access?.access ?? at.vascular ?? undefined

  // ── Intake / output (bundled inside alarms_test) ──────────────────────────
  const intake  = at.intake  != null ? String(at.intake)  : (v.intake_output?.intake  ?? undefined)
  const output  = at.output  != null ? String(at.output)  : (v.intake_output?.output  ?? undefined)

  // ── Machine ───────────────────────────────────────────────────────────────
  const machine: string | undefined =
    v.machine_id != null ? String(v.machine_id)
    : typeof v.machines === 'string' ? v.machines
    : (v.machines?.machine ?? undefined)

  // ── Dialysis parameters ───────────────────────────────────────────────────
  const hd = v.hemodialysis ?? {}
  const rawRows: any[] = hd.dialysis ?? hd.dialysis_parameters ?? []
  const dialysisParams: FlowSheetDialysisParam[] = rawRows.map(row => ({
    time:          String(row.time ?? ''),
    systolic:      String(row.blood_pressure_systolic ?? row.systolic ?? ''),
    diastolic:     String(row.blood_pressure_diastolic ?? row.diastolic ?? ''),
    site:          String(row.bp_site ?? row.site ?? ''),
    bpSite:        String(row.bp_site ?? row.site ?? ''),
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
    comments:      row.comments != null ? String(row.comments) : undefined,
  }))

  // ── Nursing actions (stored under hemodialysis.nursing_action) ────────────
  const naRaw: any[] = Array.isArray(hd.nursing_action) ? hd.nursing_action
    : Array.isArray(v.nursing_action) ? v.nursing_action
    : Array.isArray(v.nursing_actions) ? v.nursing_actions
    : []
  const nursingActions: FlowSheetNursingAction[] | undefined =
    naRaw.length > 0
      ? naRaw.map((r: any) => ({
          time:       String(r.time ?? ''),
          focus:      String(r.focus ?? ''),
          action:     String(r.nursing_action ?? r.action ?? ''),
          evaluation: String(r.evaluation ?? ''),
          name:       String(r.name ?? ''),
        }))
      : undefined

  // ── Post assessment (rich shape from new API) ─────────────────────────────
  const paRaw = v.post_assessment ?? {}
  const postAssessment: FlowSheetPostAssessment | undefined =
    Object.keys(paRaw).length > 0
      ? {
          bpSystolic:          paRaw.bp_sitting_systolic ?? null,
          bpDiastolic:         paRaw.bp_sitting_diastolic ?? null,
          bpSite:              paRaw.bp_sitting_site ?? null,
          pulse:               paRaw.pulse ?? null,
          temp:                paRaw.temp ?? null,
          tempMethod:          paRaw.temp_method ?? null,
          spo2:                paRaw.spo2 ?? null,
          rr:                  paRaw.rr ?? null,
          rbs:                 paRaw.rbs ?? null,
          weight:              paRaw.weight ?? null,
          txTimeHr:            paRaw.tx_time_hr ?? null,
          txTimeMin:           paRaw.tx_time_min ?? null,
          txTimeL:             paRaw.tx_time_l ?? null,
          dialysateL:          paRaw.dialysate_l ?? null,
          uf:                  paRaw.uf ?? null,
          blp:                 paRaw.blp ?? null,
          catheterLock:        paRaw.catheter_lock ?? null,
          arterialAccess:      paRaw.arterial_access ?? null,
          venousAccess:        paRaw.venous_access ?? null,
          needleSitesHeld:     paRaw.needle_sites_held ?? null,
          accessProblems:      paRaw.access_problems ?? null,
          machineDisinfected:  paRaw.machine_disinfected ?? null,
          medicalComplaints:   paRaw.medical_complaints ?? null,
          nonMedicalIncidence: paRaw.non_medical_incidence ?? null,
          initials:            paRaw.initials ?? null,
          signatureDate:       paRaw.signature_date ?? null,
          signatureImage:      paRaw.signature_image ?? null,
          signatureEmployeeId: paRaw.signature_employee_id ?? null,
          signatureEmployeeName: paRaw.signature_employee_name ?? null,
        }
      : undefined

  // ── Prescribed dialysis medications ───────────────────────────────────────
  const dmRaw = v.dialysis_medications
  const dialysisMedications: FlowSheetDialysisMedication[] | undefined =
    Array.isArray(dmRaw) && dmRaw.length > 0
      ? dmRaw.map((m: any) => ({
          id:                 String(m.id),
          drugId:             m.drug_id != null ? String(m.drug_id) : undefined,
          drugName:           String(m.drug_name ?? ''),
          form:               m.form ?? undefined,
          dosage:             m.dosage ?? undefined,
          route:              m.route ?? undefined,
          frequency:          m.frequency ?? undefined,
          duration:           m.duration ?? undefined,
          instructions:       m.instructions ?? undefined,
          administrationType: m.administration_type ?? undefined,
        }))
      : undefined

  // ── Outside dialysis ──────────────────────────────────────────────────────
  const od = v.outside_dialysis
  const outsideDialysis: boolean =
    od === true || od === '1' || od === 1
    || (od && typeof od === 'object' && (od.outsideDialysis === true || od.outsideDialysis === '1' || od.outsideDialysis === 1))

  // ── Patient signature (key uses a hyphen in the API response) ────────────
  const pSig = v['patient-signature'] ?? {}
  const patientSignature = pSig.patient_signature_signature_url
    ? {
        url:      String(pSig.patient_signature_signature_url),
        signedAt: String(pSig.patient_signature_signed_at ?? ''),
      }
    : undefined

  return {
    visitId,
    ...(hasVitals ? { vitals } : {}),
    bpSite:      ptv.bp_site ?? ptv.bpSite ?? undefined,
    method:      ptv.temp_method ?? ptv.method ?? undefined,
    machine,
    pain:        pa.rating != null ? String(pa.rating) : undefined,
    painDetails,
    fallRisk,
    highFallRisk,
    morseValues: fra.morseValues ?? fra.morse_values ?? undefined,
    morseTotal:  fra.morseTotal ?? fra.morse_total ?? undefined,
    outsideDialysis,
    alarmsTest:  at.passed === '1' || at.passed === true,
    intake,
    output,
    car,
    dialysate,
    access,
    anticoagType:
      typeof v.anticoagulation === 'string'
        ? v.anticoagulation
        : (v.anticoagulation?.anticoagType ?? undefined),
    dialysisParams: dialysisParams.length > 0 ? dialysisParams : undefined,
    dialysisMedications,
    nursingActions,
    postAssessment,
    patientSignature,
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

const FLOWSHEET_SECTION_KEY: Record<FlowSheetSection, string> = {
  'outside-dialysis':    'outside_dialysis',
  'pre-treatment-vitals':'pre_treatment_vital',
  'machines':            'machine_id',
  'pain-assessment':     'pain_assessment',
  'fall-risk':           'fall_risk_assessment',
  'nursing-actions':     'hemodialysis',
  'dialysis-parameters': 'hemodialysis',
  'alarms-test':         'alarms_test',
  'intake-output':       'alarms_test',
  'car':                 'alarms_test',
  'access':              'alarms_test',
  'dialysate':           'alarms_test',
  'anticoagulation':     'anticoagulation',
  'medications':         'dialysis_medications',
  'post-treatment':      'post_assessment',
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
) => submitFlowSheetSection(visitId, 'outside-dialysis', body.outsideDialysis ? '1' : '0')

export const submitFlowSheetVitals = (
  visitId: number | string,
  body: FlowSheetVitalsSectionInput,
) => submitFlowSheetSection(visitId, 'pre-treatment-vitals', {
  height:      body.vitals.height,
  weight:      body.vitals.preWeight,
  weight_dry:  body.vitals.dryWeight,
  uf_goal:     body.vitals.ufGoal,
  bp_systolic: body.vitals.bpSystolic,
  bp_diastolic:body.vitals.bpDiastolic,
  temp:        body.vitals.temperature,
  spo2:        body.vitals.spo2,
  pr_value:    body.vitals.hr,
  rr:          body.vitals.rr,
  rbs:         body.vitals.rbs,
  bp_site:     body.bpSite,
  temp_method: body.method,
})

// machine_id is a top-level key in the flowsheet — send the value directly
export const submitFlowSheetMachines = (
  visitId: number | string,
  body: FlowSheetMachinesInput,
) => submitFlowSheetSection(visitId, 'machines', body.machine)

export const submitFlowSheetPain = (
  visitId: number | string,
  body: FlowSheetPainSectionInput,
) => submitFlowSheetSection(visitId, 'pain-assessment', {
  rating:                 body.pain,
  pain_present_tool_used: body.painDetails.toolUsed,
  location:               body.painDetails.location,
  frequency:              body.painDetails.frequency,
  radiating:              body.painDetails.radiatingTo,
  type:                   body.painDetails.painType,
  occurs:                 body.painDetails.occurs,
  ambulating:             body.painDetails.ambulating,
  resting:                body.painDetails.resting,
  eating:                 body.painDetails.eating,
  relieved:               body.painDetails.relievedBy,
  worsens:                body.painDetails.worsensBy,
})

export const submitFlowSheetFallRisk = (
  visitId: number | string,
  body: FlowSheetFallRiskInput,
) => submitFlowSheetSection(visitId, 'fall-risk', {
  score:     body.fallRisk,
  high_risk: body.highFallRisk ? '1' : '0',
})

export const submitFlowSheetNursingActions = (
  visitId: number | string,
  body: FlowSheetNursingActionsInput,
) => submitFlowSheetSection(visitId, 'nursing-actions', {
  nursing_action: body.nursingActions.map(a => ({
    name:           a.name,
    time:           a.time,
    focus:          a.focus,
    evaluation:     a.evaluation,
    nursing_action: a.action,
  })),
})

export const submitFlowSheetDialysisParams = (
  visitId: number | string,
  body: FlowSheetDialysisParamsInput,
) => submitFlowSheetSection(visitId, 'dialysis-parameters', {
  dialysis: body.dialysisParams.map(p => ({
    time:                     p.time,
    blood_pressure_systolic:  p.systolic,
    blood_pressure_diastolic: p.diastolic,
    bp_site:                  p.bpSite ?? p.site,
    pulse:                    p.pulse,
    dialysate_rate:            p.dialysateRate,
    uf_rate:                  p.uf,
    bfr:                      p.bfr,
    dialysate_volume:          p.dialysateVol,
    uf_volume:                p.ufVol,
    venous:                   p.venous,
    effluent:                 p.effluent,
    access:                   p.access,
    initials:                 p.initials,
    comments:                 p.comments,
  })),
})

export const submitFlowSheetAlarmsTest = (
  visitId: number | string,
  body: FlowSheetAlarmsTestInput,
) => submitFlowSheetSection(visitId, 'alarms-test', {
  passed: body.alarmsTest ? '1' : '0',
})

export const submitFlowSheetIntakeOutput = (
  visitId: number | string,
  body: FlowSheetIntakeOutputInput,
) => submitFlowSheetSection(visitId, 'intake-output', {
  intake: body.intake,
  output: body.output,
})

// car fields (ff_percent, dialyzer, temp) are stored inside alarms_test
export const submitFlowSheetCar = (
  visitId: number | string,
  body: FlowSheetCarSectionInput,
) => submitFlowSheetSection(visitId, 'car', {
  ff_percent: body.car.ffPercent,
  dialyzer:   body.car.dialyzer,
  temp:       body.car.temp,
})

// access (vascular type) is stored as alarms_test.vascular
export const submitFlowSheetAccess = (
  visitId: number | string,
  body: FlowSheetAccessInput,
) => submitFlowSheetSection(visitId, 'access', { vascular: body.access })

// dialysate fields (k, na, hco3, glucose) are stored inside alarms_test
export const submitFlowSheetDialysate = (
  visitId: number | string,
  body: FlowSheetDialysateSectionInput,
) => submitFlowSheetSection(visitId, 'dialysate', {
  k:       body.dialysate.k,
  na:      body.dialysate.na,
  hco3:    body.dialysate.hco3,
  glucose: body.dialysate.glucose,
})

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

function serializePostAssessment(pt: FlowSheetMobilePostTx) {
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
    tx_time_hr:           pt.txTimeHr,
    tx_time_min:          pt.txTimeMin,
    tx_time_l:            pt.txTimeL,
    dialysate_l:          pt.dialysateL,
    uf:                   pt.uf,
    blp:                  pt.blp,
    catheter_lock:        pt.catheterLock,
    arterial_access:      pt.arterialAccess,
    venous_access:        pt.venousAccess,
    needle_sites_held:    pt.needleSitesHeld,
    access_problems:      pt.accessProblems,
    machine_disinfected:  pt.machineDisinfected,
    medical_complaints:   pt.medicalComplaints,
    non_medical_incidence:pt.nonMedicalIncidence,
    initials:             pt.initials,
  }
}

/**
 * Post-treatment save. Uses multipart/form-data only when a patient signature
 * PNG is present; falls back to plain JSON otherwise.
 */
export async function submitFlowSheetPostTreatment(
  visitId: number | string,
  body: FlowSheetPostTreatmentInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'in_progress')

  const hasPatientSig  = !!body.patientSignature?.dataUrl
  const hasNurseSig    = !!body.nurseSignature?.dataUrl
  const needsMultipart = hasPatientSig || hasNurseSig

  const postPayload = { post_assessment: serializePostAssessment(body.postAssessment) }

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
