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
  FlowSheetAlarmsTestFormInput,
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
import {
  type MorseFallsRiskAssessmentInput,
  buildMorseFallsRiskBody,
  parseMorseFallsRiskResponse,
} from './models/morseFallsRisk'
import type { SocialWorkerProgressNoteInput } from './models/socialWorkerProgressNote'
import type { ReferralInput } from './models/referral'
import type { DoctorProgressNoteInput, DoctorProgressNoteVitals } from './models/doctorProgressNote'
import type { RefusalInput } from './models/refusal'
import { serializeDisOfHemodialysis } from './transform/disOfHemodialysis'
import type { SariScreening, SariScreeningInput } from './models/sariScreening'
import { clock12hToApiTime } from '@/utils/time'

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
  return mapVisitFromApi(raw)
}

/**
 * Map a raw `Visit` body from the wire (flat snake_case sections) into the
 * canonical client model. Shared by `getVisitById` and `unwrapVisit` so a
 * Visit returned from a save and pushed into the query cache is shaped
 * identically to a freshly-fetched one. Without this, saving any flow-sheet
 * section would write the raw API shape into the cache, and the form would
 * read `flowSheet.dialysisParams` / `bpSite` / `preTreatmentVitals` as
 * `undefined` — the fields would blank out right after a save.
 */
function mapVisitFromApi(raw: any): Visit {
  return {
    ...raw,
    ...mapVisitTimestamps(raw),
    flowSheet: mapFlowSheetFromApi(raw),
    referrals: (() => {
      if (Array.isArray(raw.referrals)) return raw.referrals.map(mapReferralFromApi)
      if (raw.referrals && typeof raw.referrals === 'object') return [mapReferralFromApi(raw.referrals)]
      return undefined
    })(),
    sariScreenings: (() => {
      // Backend returns a single object under `respiratoryIllnessScreening`.
      // Normalise to the array shape the UI expects.
      const single = raw.respiratoryIllnessScreening ?? raw.respiratory_illness_screening
      if (single && typeof single === 'object') {
        return [mapSariScreeningFromApi({ ...single, id: single.id ?? 0, visit_id: raw.id })]
      }
      if (Array.isArray(raw.sariScreenings)) return raw.sariScreenings.map(mapSariScreeningFromApi)
      return raw.sariScreenings
    })(),
  }
}

/**
 * Translate one referral row from the wire (snake_case) to the canonical
 * camelCase `Referral`. The flat `print_*` flags collapse into a single
 * `printOptions` object on the way in.
 */
function mapReferralFromApi(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  return {
    id:                   raw.id,
    visitId:              raw.visit_id ?? raw.visitId,
    referralDate:         raw.referral_date ?? raw.referralDate ?? '',
    referralType:         raw.referral_type ?? raw.referralType ?? '',
    otherReferralType:    raw.other_referral_type ?? raw.otherReferralType ?? null,
    referralHospitalId:   raw.referral_hospital_id ?? raw.referralHospitalId ?? null,
    referralHospitalName: raw.referral_hospital_name ?? raw.referralHospitalName ?? null,
    referralReason:       raw.referral_reason ?? raw.referralReason ?? '',
    referralBy:           raw.referral_by ?? raw.referralBy ?? '',
    primaryPhysician:     raw.primary_physician ?? raw.primaryPhysician ?? '',
    completionDate:       raw.completion_date ?? raw.completionDate ?? '',
    status:               raw.status,
    comments:             raw.comments ?? null,
    printOptions: {
      monthlyMedicalReport: !!(raw.print_monthly_medical_report ?? raw.printOptions?.monthlyMedicalReport),
      systemMedicalReport:  !!(raw.print_system_medical_report  ?? raw.printOptions?.systemMedicalReport),
      labResult:            !!(raw.print_lab_result             ?? raw.printOptions?.labResult),
      last3FlowSheets:      !!(raw.print_last_3_flowsheets      ?? raw.printOptions?.last3FlowSheets),
    },
    attachmentUrl:  raw.attachment_url ?? raw.attachmentUrl ?? null,
    attachmentName: raw.attachment_name ?? raw.attachmentName ?? null,
    createdAt:      raw.created_at ?? raw.createdAt ?? '',
  }
}

/**
 * Maps `GET /visits/{id}` response into the canonical `FlowSheet` model.
 *
 * The backend returns a flat object with snake_case section keys
 * (alarms_test, hemodialysis, post_assessment, outside_dialysis,
 * pre_treatment_vital, dialysis_medications, …). Each section is optional and
 * may be missing when the nurse hasn't saved it yet.
 *
 * The flow sheet payload may arrive wrapped under `flowSheet` / `flow_sheet` /
 * `flowsheet`, or merged directly into the visit body. We accept all four.
 */
const FLOW_SHEET_SECTION_KEYS = [
  'alarms_test',
  'hemodialysis',
  'post_assessment',
  'outside_dialysis',
  'pre_treatment_vital',
  'pre_treatment_vitals',
  'pain_assessment',
  'fall_risk_assessment',
  'dialysis_medications',
  'anticoagulation',
  'machine_id',
  'machines',
  'car',
  'dialysate',
  'access',
  'intake_output',
  'nursing_action',
  'nursing_actions',
] as const

/** True when any section key is present directly on the visit body. */
function hasInlineFlowSheet(raw: any): boolean {
  if (!raw || typeof raw !== 'object') return false
  return FLOW_SHEET_SECTION_KEYS.some(k => raw[k] !== undefined)
}

/**
 * Treat a row as junk if it has no field with an actual value other than DB
 * metadata (id/created_at/updated_at). Used to drop placeholder rows the
 * backend ships for newly-created flow sheets.
 */
const ROW_METADATA_KEYS = new Set(['id', 'created_at', 'updated_at', 'deleted_at'])
function isMetadataOnlyRow(row: any): boolean {
  if (!row || typeof row !== 'object') return true
  const dataKeys = Object.keys(row).filter(k => !ROW_METADATA_KEYS.has(k))
  if (dataKeys.length === 0) return true
  return dataKeys.every(k => {
    const val = row[k]
    return val == null || val === '' || (typeof val === 'object' && Object.keys(val).length === 0)
  })
}

/**
 * Build the doctor-note "Pre-Treatment Vitals" snapshot.
 *
 * The backend ships a `preTreatmentVitals` object whose inner keys have been
 * seen in both camelCase (docs: `respiratoryRate`) and snake_case (live:
 * `respiratory_rate`, `weight`, `weight_dry`, `uf_goal`). Accept either, and
 * fall back to the raw `pre_treatment_vital` section when the snapshot is
 * absent (deriving `bloodPressure` from the systolic/diastolic parts).
 */
function mapDoctorVitals(snap: any, ptv: any): DoctorProgressNoteVitals | undefined {
  const s = snap && typeof snap === 'object' ? snap : {}
  const str = (x: any): string | undefined =>
    x != null && String(x).trim() !== '' ? String(x) : undefined
  const bpFromParts =
    ptv?.bp_systolic && ptv?.bp_diastolic ? `${ptv.bp_systolic}/${ptv.bp_diastolic}` : undefined

  const out: DoctorProgressNoteVitals = {
    temperature:      str(s.temperature       ?? ptv?.temp),
    respiratoryRate:  str(s.respiratory_rate  ?? s.respiratoryRate  ?? ptv?.rr),
    oxygenSaturation: str(s.oxygen_saturation ?? s.oxygenSaturation ?? ptv?.spo2),
    bloodPressure:    str(s.blood_pressure    ?? s.bloodPressure    ?? bpFromParts),
    pulseRate:        str(s.pulse_rate        ?? s.pulseRate        ?? ptv?.pr_value),
    height:           str(s.height            ?? ptv?.height),
    preWeight:        str(s.weight            ?? s.preWeight        ?? ptv?.weight),
    dryWeight:        str(s.weight_dry        ?? s.dryWeight        ?? ptv?.weight_dry),
    ufGoal:           str(s.uf_goal           ?? s.ufGoal           ?? ptv?.uf_goal),
    rbs:              str(s.rbs               ?? ptv?.rbs),
  }
  return Object.values(out).some((x) => x != null) ? out : undefined
}

function mapFlowSheetFromApi(raw: any): FlowSheet | undefined {
  const wrapped =
    raw?.flowSheet && typeof raw.flowSheet === 'object' ? raw.flowSheet
    : raw?.flow_sheet && typeof raw.flow_sheet === 'object' ? raw.flow_sheet
    : raw?.flowsheet && typeof raw.flowsheet === 'object' ? raw.flowsheet
    : undefined
  const v: Record<string, any> | undefined =
    wrapped ?? (hasInlineFlowSheet(raw) ? raw : undefined)
  if (!v) return undefined

  const sectionKeys = Object.keys(v).filter(k => k !== 'visitId')
  if (sectionKeys.length === 0) return undefined

  const visitId = Number(raw?.id ?? v.visitId)

  // ── Pre-treatment vitals ──────────────────────────────────────────────────
  // Backend has been seen using both `pre_treatment_vital` (singular) and
  // `pre_treatment_vitals` (plural). Accept either.
  const ptv = v.pre_treatment_vital ?? v.pre_treatment_vitals ?? {}
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

  // ── Morse Falls Risk Assessment (boolean-flag shape) ──────────────────────
  // Newer API: `morse_falls_risk_assessment` with one flag per scoring option
  // plus per-action booleans. The backend currently ships it at the **top
  // level** of the visit response (alongside `flowSheet`, not inside it); we
  // also accept the inline variant for forward-compat.
  // Legacy: `fall_risk_assessment.morseValues` with numeric a..f.
  const morseRaw =
    raw?.morse_falls_risk_assessment ?? raw?.morseFallsRiskAssessment ??
    v.morse_falls_risk_assessment ?? v.morseFallsRiskAssessment
  const morse = parseMorseFallsRiskResponse(morseRaw)

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
  // Canonical values are `av_fistula | av_graft | cvc_temporary | permacath`.
  // Older records persisted the display label ("AVF" / "AVG" / "CATHETER") —
  // normalize so the AccessForm radio still highlights the right option.
  const rawAccess: string | undefined =
    typeof v.access === 'string' ? v.access
    : v.access?.access ?? at.vascular ?? undefined
  const access: string | undefined = (() => {
    if (!rawAccess) return undefined
    const key = String(rawAccess).trim().toLowerCase()
    const legacy: Record<string, string> = {
      'avf': 'av_fistula',
      'avf.': 'av_fistula',
      'avg': 'av_graft',
      'catheter': 'cvc_temporary',
      'permacath': 'permacath',
    }
    return legacy[key] ?? rawAccess
  })()

  // ── Intake / output (bundled inside alarms_test) ──────────────────────────
  const intake  = at.intake  != null ? String(at.intake)  : (v.intake_output?.intake  ?? undefined)
  const output  = at.output  != null ? String(at.output)  : (v.intake_output?.output  ?? undefined)

  // ── Machine ───────────────────────────────────────────────────────────────
  const machine: string | undefined =
    v.machine_id != null ? String(v.machine_id)
    : typeof v.machines === 'string' ? v.machines
    : (v.machines?.machine ?? undefined)

  // ── Dialysis parameters ───────────────────────────────────────────────────
  // The backend sometimes ships a placeholder row carrying only DB metadata
  // (e.g. `{ created_at: ... }`) — skip those so the UI doesn't render empty
  // rows.
  const hd = v.hemodialysis ?? {}
  const rawRowsAll: any[] = hd.dialysis ?? hd.dialysis_parameters ?? []
  const rawRows = rawRowsAll.filter(r => !isMetadataOnlyRow(r))
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
  const naRawAll: any[] = Array.isArray(hd.nursing_action) ? hd.nursing_action
    : Array.isArray(v.nursing_action) ? v.nursing_action
    : Array.isArray(v.nursing_actions) ? v.nursing_actions
    : []
  const naRaw = naRawAll.filter(r => !isMetadataOnlyRow(r))
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
          ufNet:               paRaw.uf_net ?? null,
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
  // Accept all three shapes seen from the backend:
  //   1. `raw.medications`             – top-level camelCase list (current)
  //   2. `v.medications`               – inside the flowSheet section, key "medications"
  //   3. `v.dialysis_medications`      – legacy snake_case key inside flowSheet
  const dmRaw = raw?.medications ?? v.medications ?? v.dialysis_medications
  const dialysisMedications: FlowSheetDialysisMedication[] | undefined =
    Array.isArray(dmRaw) && dmRaw.length > 0
      ? dmRaw.map((m: any) => ({
          id:                 String(m.id),
          drugId:             m.drug_id ?? m.drugId ?? undefined,
          drugName:           String(m.drug_name ?? m.drugName ?? ''),
          form:               m.form ?? undefined,
          dosage:             m.dosage ?? undefined,
          route:              m.route ?? undefined,
          frequency:          m.frequency ?? undefined,
          duration:           m.duration ?? undefined,
          durationPeriod:     m.duration_period ?? m.durationPeriod ?? undefined,
          instructions:       m.instructions ?? undefined,
          administrationType: m.administration_type ?? m.adminType ?? undefined,
          administered:       m.administered ?? undefined,
        }))
      : undefined

  // ── Outside dialysis ──────────────────────────────────────────────────────
  const od = v.outside_dialysis
  const outsideDialysis: boolean =
    od === true || od === '1' || od === 1
    || (od && typeof od === 'object' && (od.outsideDialysis === true || od.outsideDialysis === '1' || od.outsideDialysis === 1))

  // ── Signatures (stored on the server, returned as URLs) ──────────────────
  // Three response shapes seen in the wild:
  //   • Top-level `patient_signature_url` + `nurse_signature_url`     (current)
  //   • Hyphenated wrapper `patient-signature.patient_signature_*` /
  //     `nurse-signature.nurse_signature_*`                           (current backend)
  //   • Same fields under `nurseSignature` / `patientSignature` objects
  // The signature host returns bare filenames (e.g. "6a1aab0816679.png").
  // `resolveSignatureUrl` expands them to the absolute `/uploads/signatures/<file>`
  // URL on the signature host so the SignaturePad WebView can render the image.
  const pSigLegacy = v['patient-signature'] ?? {}
  const rawPatientUrl =
    v.patient_signature_url ??
    v.patientSignature?.url ??
    pSigLegacy.patient_signature_signature_url ??
    null
  // Nurse signature lives inside `post_assessment`.
  // Backend may use `post_assessment_signature_url` (current) or legacy `signature_image`.
  const rawNurseUrl = paRaw.post_assessment_signature_url ?? paRaw.signature_image ?? null
  const patientSignature = rawPatientUrl
    ? {
        url:      resolveSignatureUrl(String(rawPatientUrl)),
        signedAt: String(v.patient_signature_signed_at ?? pSigLegacy.patient_signature_signed_at ?? ''),
      }
    : undefined
  const nurseSignature = rawNurseUrl
    ? {
        url:      resolveSignatureUrl(String(rawNurseUrl)),
        signedAt: String(
          paRaw.post_assessment_signature_signed_at ??
          paRaw.signature_date ??
          '',
        ),
      }
    : undefined

  return {
    visitId,
    ...(hasVitals ? { vitals } : {}),
    preTreatmentVitals: mapDoctorVitals(v.preTreatmentVitals ?? v.pre_treatment_vitals_snapshot, ptv),
    bpSite:      ptv.bp_site ?? ptv.bpSite ?? undefined,
    method:      ptv.temp_method ?? ptv.method ?? undefined,
    machine,
    pain:        pa.rating != null ? String(pa.rating) : undefined,
    painDetails,
    fallRisk,
    highFallRisk,
    morseValues:  morse?.morseValues ?? fra.morseValues ?? fra.morse_values ?? undefined,
    morseTotal:   morse?.morseTotal  ?? fra.morseTotal  ?? fra.morse_total  ?? undefined,
    morseActions: morse?.morseActions,
    outsideDialysis,
    alarmsTest:  at.passed === '1' || at.passed === true,
    intake,
    output,
    car,
    dialysate,
    access,
    anticoagType: (() => {
      // `dialysisOrder` lives at the visit root (sibling of `flowSheet`),
      // not inside it — read it from `raw`.
      const fromOrder = raw?.dialysisOrder?.administrationType
      if (typeof fromOrder === 'string' && fromOrder.length > 0) {
        // backend may double-encode the value (e.g. `"\"UFH\""`) — strip wrapping quotes
        return fromOrder.replace(/^"+|"+$/g, '')
      }
      return typeof v.anticoagulation === 'string'
        ? v.anticoagulation
        : (v.anticoagulation?.anticoagType ?? undefined)
    })(),
    anticoagBolusValue:  raw?.dialysisOrder?.bolusValue ?? undefined,
    anticoagHourlyValue: raw?.dialysisOrder?.hourlyValue ?? undefined,
    dialyzerType:        raw?.dialysisOrder?.dialyzerType ?? undefined,
    dialyzerSurfaceArea: raw?.dialysisOrder?.dialyzerSurfaceArea ?? undefined,
    dialysisParams: dialysisParams.length > 0 ? dialysisParams : undefined,
    dialysisMedications,
    nursingActions,
    postAssessment,
    patientSignature,
    nurseSignature,
  }
}

/**
 * Resolve a signature reference returned by the backend to an absolute URL.
 *
 * The signature host (`ENV.SIGNATURE_API_BASE_URL`, e.g.
 * `https://staging.careconnectksa.com/api`) stores files under
 * `/uploads/signatures/<filename>`. The server may send back either:
 *   • a bare filename ("6a1aab0816679.png") → prepend `/uploads/signatures/`
 *   • an absolute path ("/uploads/signatures/foo.png") → join with the origin
 *   • a fully-qualified URL → return as-is
 */
function resolveSignatureUrl(value: string): string {
  if (!value) return value
  if (/^https?:\/\//i.test(value)) return value
  const origin = ENV.SIGNATURE_API_BASE_URL.replace(/\/api\/?$/, '')
  if (!value.includes('/')) {
    return `${origin}/uploads/signatures/${value}`
  }
  return `${origin}${value.startsWith('/') ? '' : '/'}${value}`
}

// ─── Visit status transitions ───────────────────────────────────────────────
//
// Each transition returns the updated Visit so the UI can refresh its cache.

/**
 * Normalise the wall-clock timestamps the backend ships in snake_case
 * (`start_time`, `end_time`, `start_procedure_time`, `end_procedure_time`)
 * onto the canonical camelCase `Visit` fields the UI reads. Each may be null
 * until the corresponding transition has run.
 */
const mapVisitTimestamps = (raw: any) => ({
  startTime:          raw.start_time ?? raw.startTime ?? null,
  endTime:            raw.end_time ?? raw.endTime ?? null,
  startProcedureTime: raw.start_procedure_time ?? raw.startProcedureTime ?? null,
  endProcedureTime:   raw.end_procedure_time ?? raw.endProcedureTime ?? null,
  doctorCheckInTime:  raw.doctor_check_in_time ?? raw.doctorCheckInTime ?? null,
  doctorCheckOutTime: raw.doctor_check_out_time ?? raw.doctorCheckOutTime ?? null,
})

const unwrapVisit = (raw: any): Visit => {
  const v = raw?.data ?? raw
  if (!v || typeof v !== 'object') return v
  return mapVisitFromApi(v)
}

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

/** Start the dialysis procedure → moves the visit into `start_procedure`. */
export async function startVisit(visitId: number | string): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'start_procedure')
  const res = await apiClient.post(`/visits/${visitId}/start-procedure`)
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
  // Backend expects snake_case fields in `H:i:s` (24-hour) format on `/edit-time`.
  const payload: Record<string, string> = {}
  if (body.startTime) payload.start_procedure_time = clock12hToApiTime(body.startTime)
  if (body.endTime) payload.end_procedure_time = clock12hToApiTime(body.endTime)
  const res = await apiClient.post(`/visits/${visitId}/edit-time`, payload)
  return unwrapVisit(res.data)
}

/** End the dialysis procedure → moves the visit into `end_procedure`. */
export async function endVisit(visitId: number | string): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'end_procedure')
  const res = await apiClient.post(`/visits/${visitId}/end-procedure`)
  return unwrapVisit(res.data)
}

/** Check out → completes the visit. */
export async function checkoutVisit(visitId: number | string): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(visitId, 'completed')
  const res = await apiClient.post(`/visits/${visitId}/checkout`)
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
  height:       body.vitals.height,
  weight:       body.vitals.preWeight,
  weight_dry:   body.vitals.dryWeight,
  uf_goal:      body.vitals.ufGoal,
  bp_systolic:  body.vitals.bpSystolic,
  bp_diastolic: body.vitals.bpDiastolic,
  temp:         body.vitals.temperature,
  spo2:         body.vitals.spo2,
  pr:           body.vitals.prSite,   // PR palpation site (Radial / Carotid / …)
  pr_value:     body.vitals.hr,        // PR rate (Bpm)
  rr:           body.vitals.rr,
  rbs:          body.vitals.rbs,
  bmi:          body.vitals.bmi,
  bmi_category: body.vitals.bmiCategory,
  bp_site:      body.bpSite,
  temp_method:  body.method,
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

/** Serialize one nursing-action row into the backend snake_case shape. */
const serializeNursingAction = (a: FlowSheetNursingAction) => ({
  name:           a.name,
  time:           a.time,
  focus:          a.focus,
  evaluation:     a.evaluation,
  nursing_action: a.action,
})

/** Serialize one dialysis-parameter row into the backend snake_case shape. */
const serializeDialysisParam = (p: FlowSheetDialysisParam) => ({
  time:                     p.time,
  blood_pressure_systolic:  p.systolic,
  blood_pressure_diastolic: p.diastolic,
  // Web's Dialysis Parameters table reads the BP site from `site`; we also keep
  // `bp_site` so the mobile round-trip (which reads either) stays intact.
  bp_site:                  p.bpSite ?? p.site,
  site:                     p.bpSite ?? p.site,
  pulse:                    p.pulse,
  dialysate_rate:           p.dialysateRate,
  uf_rate:                  p.uf,
  bfr:                      p.bfr,
  dialysate_volume:         p.dialysateVol,
  uf_volume:                p.ufVol,
  venous:                   p.venous,
  effluent:                 p.effluent,
  access:                   p.access,
  initials:                 p.initials,
  comments:                 p.comments,
})

/**
 * Build the merged `hemodialysis` envelope. Both arrays go on every save so
 * the backend can rewrite the whole record without dropping the side that
 * wasn't edited this round.
 */
function buildHemodialysisPayload(
  dialysisParams: FlowSheetDialysisParam[] | undefined,
  nursingActions: FlowSheetNursingAction[] | undefined,
) {
  return {
    dialysis: (dialysisParams ?? []).map(serializeDialysisParam),
    nursing_action: (nursingActions ?? []).map(serializeNursingAction),
  }
}

export const submitFlowSheetNursingActions = (
  visitId: number | string,
  body: FlowSheetNursingActionsInput,
) => submitFlowSheetSection(
  visitId,
  'nursing-actions',
  buildHemodialysisPayload(body.dialysisParams, body.nursingActions),
)

export const submitFlowSheetDialysisParams = (
  visitId: number | string,
  body: FlowSheetDialysisParamsInput,
) => submitFlowSheetSection(
  visitId,
  'dialysis-parameters',
  buildHemodialysisPayload(body.dialysisParams, body.nursingActions),
)

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

/**
 * Combined "Alarms Test" form save. The alarms toggle, intake/output, CAR,
 * access and dialysate all live under the backend `alarms_test` record, so we
 * send every field in ONE request — saving them with separate calls would make
 * each request overwrite the previous one's fields on the shared record.
 */
export const submitFlowSheetAlarmsTestForm = (
  visitId: number | string,
  body: FlowSheetAlarmsTestFormInput,
) => submitFlowSheetSection(visitId, 'alarms-test', {
  passed:     body.alarmsTest ? '1' : '0',
  intake:     body.intake,
  output:     body.output,
  ff_percent: body.car.ffPercent,
  dialyzer:   body.car.dialyzer,
  temp:       body.car.temp,
  vascular:   body.access,
  k:          body.dialysate.k,
  na:         body.dialysate.na,
  hco3:       body.dialysate.hco3,
  glucose:    body.dialysate.glucose,
})

export const submitFlowSheetAnticoagulation = (
  visitId: number | string,
  body: FlowSheetAnticoagulationInput,
) => submitFlowSheetSection(visitId, 'anticoagulation', {
  anticoagType:        body.anticoagType,
  bolusValue:          body.bolusValue,
  hourlyValue:         body.hourlyValue,
  dialyzerType:        body.dialyzerType,
  dialyzerSurfaceArea: body.dialyzerSurfaceArea,
})

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
    uf_net:               pt.ufNet,
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

  const pSig = body.patientSignature
  const nSig = body.nurseSignature
  // A signature is "pre-uploaded" if SignatureField already pushed it to
  // /signatures/upload and we have the returned token. Inline binary upload
  // is only needed when there's a dataUrl but no signatureUrl (e.g. upload
  // failed or the user is on a stale client).
  const patientInline = !!pSig?.dataUrl && !pSig.signatureUrl
  const nurseInline   = !!nSig?.dataUrl && !nSig.signatureUrl
  const needsMultipart = patientInline || nurseInline

  const postPayload: Record<string, unknown> = {
    post_assessment: serializePostAssessment(body.postAssessment),
  }
  if (pSig?.signatureUrl) {
    // Mirror the backend's response shape: hyphenated wrapper
    // `patient-signature` carrying the `_signature_url` / `_signed_at` /
    // `_is_relative` fields. Legacy flat keys are kept for back-compat.
    postPayload['patient-signature'] = {
      patient_signature_signature_url: pSig.signatureUrl,
      patient_signature_signed_at:     pSig.signedAt ?? '',
      patient_signature_is_relative:   '0',
    }
    postPayload.patient_signature_url = pSig.signatureUrl
    if (pSig.signedAt) postPayload.patient_signature_signed_at = pSig.signedAt
  }
  if (nSig?.signatureUrl) {
    const pa = postPayload.post_assessment as Record<string, unknown>
    pa.post_assessment_signature_url = nSig.signatureUrl
    pa.signature_image = nSig.signatureUrl  // legacy fallback key
    if (nSig.signedAt) pa.signature_date = nSig.signedAt
  }
  // Nurse confirmation audit (read-only mode or freshly drawn) — merged into
  // the existing `post_assessment` object as `post_assessment_signature_*`
  // fields. Emitted even when there's no image.
  if (nSig) {
    const fmtDate = (iso: string | undefined): string => {
      const d = new Date(iso ?? Date.now())
      if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10).replace(/-/g, '/')
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
    }
    const pa = postPayload.post_assessment as Record<string, unknown>
    pa.post_assessment_signature_signed_at = fmtDate(nSig.signedAt)
    pa.post_assessment_signature_signed_by = body.currentUserId != null ? String(body.currentUserId) : ''
  }

  if (!needsMultipart) {
    const res = await apiClient.post(
      `/visits/${visitId}/forms/flowsheet`,
      postPayload,
    )
    return unwrapVisit(res.data)
  }

  const fd = new FormData()
  fd.append('data', JSON.stringify(postPayload))

  if (patientInline) {
    fd.append('patient_signature', dataUrlToFile(pSig!.dataUrl, 'patient_signature'))
    if (pSig!.signedAt) {
      fd.append('patient_signature_signed_at', pSig!.signedAt)
    }
  }
  if (nurseInline) {
    fd.append('nurse_signature', dataUrlToFile(nSig!.dataUrl, 'nurse_signature'))
    if (nSig!.signedAt) {
      fd.append('nurse_signature_signed_at', nSig!.signedAt)
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
  // Wire shape for `/forms/progress-notes` (doctor):
  //   { type: "doctor", notes, isAddendum, parentNoteId? }
  // `notes` (plural) carries the text. When `isAddendum` is true the
  // request must reference the original note via `parentNoteId`.
  const body: Record<string, unknown> = {
    type:       'doctor',
    notes:      payload.note,
    isAddendum: payload.isAddendum,
  }
  if (payload.isAddendum && payload.parentNoteId != null) {
    body.parentNoteId = payload.parentNoteId
  }
  const res = await apiClient.post(
    `/visits/${payload.visitId}/forms/progress-notes`,
    body,
  )
  return unwrapVisit(res.data)
}

/**
 * Save the Morse Falls Risk Assessment. The morse sheet collects category
 * scores + recommended actions; this serializes them to the flat boolean
 * shape the backend expects (`gait_20`, `iv_therapy_0`, `high_protocol`, …).
 *
 *   POST /visits/{id}/forms/morse-falls-risk-assessment
 */
export async function submitMorseFallsRiskAssessment(
  payload: MorseFallsRiskAssessmentInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) return patchMockVisit(Number(payload.visitId), 'in_progress')
  const body = buildMorseFallsRiskBody(payload)
  const res = await apiClient.post(
    `/visits/${payload.visitId}/forms/morse-falls-risk-assessment`,
    body,
  )
  return unwrapVisit(res.data)
}

/**
 * Mark a dialysis medication as administered (yes) or skipped (no) for the
 * current visit.
 *
 *   POST /actions/patient-medications/{medicationId}
 *   {
 *     "action": "administered_by",            ← always this literal
 *     "data": { "action": 1 | 0, "reason": null | string }
 *   }
 *
 * `data.action` is `1` (Yes) or `0` (No). When `0`, the nurse must provide a
 * reason; when `1`, `reason` is sent as `null`.
 *
 * The response echoes the recorded action, but doesn't include the rest of
 * the visit — callers should invalidate / refetch the visit if they need the
 * freshest snapshot.
 */
export async function submitMedicationAdministration(input: {
  medicationId: number | string
  visitId: number | string
  action: 0 | 1
  reason?: string | null
}): Promise<unknown> {
  if (ENV.USE_MOCK_DATA) return undefined
  const body = {
    action: 'administered_by',
    data: {
      action: input.action,
      reason: input.action === 1 ? null : (input.reason ?? null),
    },
    condition: {
      form:     'flowsheet',
      visit_id: Number(input.visitId),
    },
  }
  const res = await apiClient.post(
    `/actions/patient-medications/${input.medicationId}`,
    body,
  )
  return res.data?.data ?? res.data
}

/**
 * Map one raw API sari-screening row (flat snake/camel field names as returned
 * by GET /visits/{id}) back into the canonical `SariScreening` model.
 *
 * API wire shape (flat):
 *   name, date, travel, contact, exposure,
 *   exposure1, exposure2, exposure3, exposure4,
 *   step1 … step5
 */
function mapSariScreeningFromApi(raw: any): SariScreening {
  return {
    id:                       raw.id,
    visitId:                  raw.visit_id ?? raw.visitId,
    addressographPatientName: raw.name ?? raw.addressographPatientName ?? '',
    dateTime:                 raw.date ?? raw.dateTime ?? '',
    sariFeatures: {
      fever:               raw.travel               ?? raw.sariFeatures?.fever               ?? null,
      coughOrBreathing:    raw.contact              ?? raw.sariFeatures?.coughOrBreathing    ?? null,
      radiographicEvidence:raw.exposure             ?? raw.sariFeatures?.radiographicEvidence?? null,
    },
    exposureCriteria: {
      closeContactSari:              raw.exposure1 ?? raw.exposureCriteria?.closeContactSari              ?? null,
      travelToPhacNotice:            raw.exposure2 ?? raw.exposureCriteria?.travelToPhacNotice            ?? null,
      recentExposurePotentialSource: raw.exposure3 ?? raw.exposureCriteria?.recentExposurePotentialSource ?? null,
      inconsistentWithOtherKnownCause: raw.exposure4 ?? raw.exposureCriteria?.inconsistentWithOtherKnownCause ?? null,
    },
    actions: {
      thinkInfectionControl:            raw.step1 ?? raw.actions?.thinkInfectionControl            ?? null,
      tellMedicalHealthOfficer:         raw.step2 ?? raw.actions?.tellMedicalHealthOfficer         ?? null,
      tellInfectionControl:             raw.step3 ?? raw.actions?.tellInfectionControl             ?? null,
      consultInfectiousDiseaseSpecialist: raw.step4 ?? raw.actions?.consultInfectiousDiseaseSpecialist ?? null,
      test:                             raw.step5 ?? raw.actions?.test                             ?? null,
    },
    author:    raw.author    ?? '',
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  }
}

export async function submitSariScreening(
  payload: SariScreeningInput,
): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitSariScreening(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }
  const { visitId, addressographPatientName, dateTime, sariFeatures, exposureCriteria, actions } = payload
  const body = {
    name:      addressographPatientName,
    date:      dateTime,
    travel:    sariFeatures.fever,
    contact:   sariFeatures.coughOrBreathing,
    exposure:  sariFeatures.radiographicEvidence,
    exposure1: exposureCriteria.closeContactSari,
    exposure2: exposureCriteria.travelToPhacNotice,
    exposure3: exposureCriteria.recentExposurePotentialSource,
    exposure4: exposureCriteria.inconsistentWithOtherKnownCause,
    step1:     actions.thinkInfectionControl,
    step2:     actions.tellMedicalHealthOfficer,
    step3:     actions.tellInfectionControl,
    step4:     actions.consultInfectiousDiseaseSpecialist,
    step5:     actions.test,
  }
  const res = await apiClient.post(
    `/visits/${visitId}/forms/respiratory-illness-screening`,
    body,
  )
  return unwrapVisit(res.data)
}

/**
 * Discontinuation-of-Hemodialysis (refusal) save.
 *
 * Endpoint: `POST /visits/{id}/forms/dis-of-hemodialysis`
 *
 * The wire shape is a single flat JSON object with bilingual fields keyed by
 * `<field>_en` / `<field>_ar`. Drawn signatures (witness / relative /
 * interpreter) ride as pre-uploaded URLs from POST /signatures/upload; the
 * doctor's signature is typed (the name itself is the signature). See
 * `data/transform/disOfHemodialysis.ts` for the field map.
 */
export async function submitRefusal(payload: RefusalInput): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitRefusal(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }

  const body = serializeDisOfHemodialysis(payload.en, payload.ar, {
    currentUserId: payload.currentUserId,
  })
  const res = await apiClient.post(
    `/visits/${payload.visitId}/forms/dis-of-hemodialysis`,
    body,
  )
  return unwrapVisit(res.data)
}

/**
 * Referral save — `POST /visits/{id}/forms/referrals` (plural).
 *
 * Body shape:
 *   • `data` — single JSON multipart field with snake_case keys including
 *     status, referral_by, referral_date, referral_type, completion_date,
 *     referral_reason, referral_hospital_id, primary_physician,
 *     other_referral_type, comments, and the flat print_* booleans.
 *   • `attachment` — optional file (image / PDF) when the nurse picked one.
 */
export async function submitReferral(payload: ReferralInput): Promise<Visit> {
  if (ENV.USE_MOCK_DATA) {
    await mockSubmitReferral(payload)
    return patchMockVisit(payload.visitId, 'in_progress')
  }

  const data: Record<string, unknown> = {
    status:                        payload.status,
    referral_by:                   payload.referralBy,
    referral_date:                 payload.referralDate,
    referral_type:                 payload.referralType,
    other_referral_type:           payload.otherReferralType ?? null,
    referral_hospital_id:          payload.referralHospitalId,
    referral_reason:               payload.referralReason,
    primary_physician:             payload.primaryPhysician,
    completion_date:               payload.completionDate,
    comments:                      payload.comments ?? null,
    print_monthly_medical_report:  payload.printOptions.monthlyMedicalReport,
    print_system_medical_report:   payload.printOptions.systemMedicalReport,
    print_lab_result:              payload.printOptions.labResult,
    print_last_3_flowsheets:       payload.printOptions.last3FlowSheets,
  }

  // Preferred path: attachment was already uploaded to /signatures/upload, so
  // we send the returned token as plain JSON — no multipart needed.
  if (payload.attachmentSignatureUrl) {
    data.attachment_signature_url = payload.attachmentSignatureUrl
    if (payload.attachmentName) data.attachment_name = payload.attachmentName
    const res = await apiClient.post(
      `/visits/${payload.visitId}/forms/referrals`,
      data,
    )
    return unwrapVisit(res.data)
  }

  // Legacy fallback: upload the file inline as multipart on save.
  const fd = new FormData()
  fd.append('data', JSON.stringify(data))

  if (payload.attachmentUri) {
    const name = payload.attachmentName ?? 'attachment'
    const lower = name.toLowerCase()
    const type =
      lower.endsWith('.png')  ? 'image/png'  :
      lower.endsWith('.pdf')  ? 'application/pdf' :
      lower.endsWith('.heic') ? 'image/heic' :
      'image/jpeg'
    fd.append('attachment', {
      uri:  payload.attachmentUri,
      name,
      type,
    } as unknown as Blob)
  }

  const res = await apiClient.post(
    `/visits/${payload.visitId}/forms/referrals`,
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
  // Dedicated endpoint for social-worker notes (NOT the same /forms/progress-notes
  // used by the doctor). Body: { notes, on_call, in_center } — the visit
  // context is expressed as two booleans rather than a single field.
  const res = await apiClient.post(
    `/visits/${payload.visitId}/forms/social-worker-progress-note`,
    {
      notes:     payload.note,
      on_call:   payload.location === 'on_call',
      in_center: payload.location === 'in_center',
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
