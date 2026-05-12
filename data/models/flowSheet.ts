// Flow Sheet data model — sent to the API when a visit is checked out.
// Fields map 1:1 to the form state held in the Visit Detail screen.

export interface FlowSheetVitals {
  height: string
  preWeight: string
  bmi: string
  dryWeight: string
  ufGoal: string
  bpSystolic: string
  bpDiastolic: string
  bpSite: string
  temperature: string
  method: string
  spo2: string
  hr: string
  rr: string
  rbs: string
}

export interface FlowSheetMobileVitals {
  height: string
  preWeight: string
  dryWeight: string
  ufGoal: string
  bpSystolic: string
  bpDiastolic: string
  temperature: string
  spo2: string
  hr: string
  rr: string
  rbs: string
}

export interface FlowSheetPainDetails {
  toolUsed: string
  location: string
  frequency: string
  radiatingTo: string
  painType: string
  occurs: string
  ambulating: string
  resting: string
  eating: string
  relievedBy: string
  worsensBy: string
}

export interface FlowSheetNursingAction {
  time: string
  focus: string
  action: string
  evaluation: string
  name: string
}

export interface FlowSheetDialysisParam {
  time: string
  systolic: string
  diastolic: string
  site: string
  pulse: string
  dialysateRate: string
  uf: string
  bfr: string
  dialysateVol: string
  ufVol: string
  venous: string
  effluent: string
  access: string
  alarms: string
  initials: string
}

export interface FlowSheetCar {
  ffPercent: string
  dialyzer: string
  temp: string
}

export interface FlowSheetDialysate {
  na: string
  hco3: string
  k: string
  glucose: string
}

export interface FlowSheetPostTx {
  bpSystolic: string
  bpDiastolic: string
  bpSite: string
  pulse: string
  temp: string
  method: string
  spo2: string
  rr: string
  rbs: string
  weight: string
  txHr: string
  txMin: string
  txL: string
  dialysateL: string
  ufL: string
  blp: string
  catheterLock: string
  arterialAccess: string
  venousAccess: string
  ufNet: string
  machineDisinfected: boolean
  accessBleeding: string
  needleHeld: string
  medicalComplaints: string
  nonMedicalIncidence: string
  initials: string
}

export interface FlowSheetMobilePostTx {
  postWeight: string
  lastBp: string
  lastPulse: string
  condition: string
  notes: string
}

export interface MorseFallScale {
  historyOfFalling: number | null
  secondaryDiagnosis: number | null
  ambulatoryAid: number | null
  ivTherapy: number | null
  gaitTransfer: number | null
  mentalStatus: number | null
  total: number
  actions: Record<string, boolean>
}

/**
 * Signature on the **upload** path. The PNG is held in memory as a base64
 * data URI captured by `SignaturePad`. The repository converts this into a
 * `multipart/form-data` file part before posting; the data URI never goes
 * over the wire as a JSON string.
 */
export interface SavedSignature {
  dataUrl: string // base64 PNG data URI (local only — never sent in JSON)
  signedAt: string // ISO 8601
}

/**
 * Signature on the **response** path. The backend stores the uploaded PNG
 * (e.g. on S3) and returns its URL alongside the timestamp.
 */
export interface StoredSignature {
  url: string // https://... (PNG)
  signedAt: string // ISO 8601
}

// ─── Per-section save inputs ────────────────────────────────────────────────
//
// Each collapsible section in the mobile flow sheet has its own Save button
// posting to `POST /visits/{visitId}/flow-sheet/{slug}` with the matching
// input body below. Every section accepts an optional `signature` so any form
// that captures one (now or later) can send it alongside its data.

export interface FlowSheetOutsideDialysisInput {
  outsideDialysis: boolean
  signature?: SavedSignature
}

export interface FlowSheetVitalsSectionInput {
  vitals: FlowSheetMobileVitals
  bpSite: string
  method: string
  signature?: SavedSignature
}

export interface FlowSheetMachinesInput {
  machine: string
  signature?: SavedSignature
}

export interface FlowSheetPainSectionInput {
  pain: string
  painDetails: FlowSheetPainDetails
  signature?: SavedSignature
}

export interface FlowSheetFallRiskInput {
  fallRisk: string
  highFallRisk: boolean
  morseValues?: {
    a: number | null
    b: number | null
    c: number | null
    d: number | null
    e: number | null
    f: number | null
  }
  morseTotal?: number
  signature?: SavedSignature
}

export interface FlowSheetNursingActionsInput {
  nursingActions: FlowSheetNursingAction[]
  signature?: SavedSignature
}

export interface FlowSheetDialysisParamsInput {
  dialysisParams: FlowSheetDialysisParam[]
  signature?: SavedSignature
}

export interface FlowSheetAlarmsTestInput {
  alarmsTest: boolean
  signature?: SavedSignature
}

export interface FlowSheetIntakeOutputInput {
  intake: string
  output: string
  signature?: SavedSignature
}

export interface FlowSheetCarSectionInput {
  car: FlowSheetCar
  signature?: SavedSignature
}

export interface FlowSheetAccessInput {
  access: string
  signature?: SavedSignature
}

export interface FlowSheetDialysateSectionInput {
  dialysate: FlowSheetDialysate
  signature?: SavedSignature
}

export interface FlowSheetAnticoagulationInput {
  anticoagType: string
  signature?: SavedSignature
}

export interface FlowSheetMedicationAdmin {
  status: 'yes' | 'no' | null
  timestamp: string
  reason: string
}

export interface FlowSheetMedicationsInput {
  /** Keyed by medication id. */
  medAdmin: Record<number, FlowSheetMedicationAdmin>
  signature?: SavedSignature
}

export interface FlowSheetPostTreatmentInput {
  postTx: FlowSheetMobilePostTx
  /** Patient consent signature — captured at the bottom of post-treatment. */
  patientSignature?: SavedSignature
  /** Nurse witness signature — captured at the bottom of post-treatment. */
  nurseSignature?: SavedSignature
}

/**
 * Flow Sheet **response** shape — the snapshot the backend returns inside
 * `Visit.flowSheet`. Signatures are URLs (the PNG is stored remotely),
 * not inline data.
 *
 * Every field except `visitId` is optional because the flow sheet grows
 * incrementally: each Save in §9.1.1–§9.1.15 may have populated only some
 * sections. The backend should return `null` / omit the keys that have not
 * been submitted yet.
 */
import type { DoctorProgressNoteVitals } from './doctorProgressNote'

export interface FlowSheet {
  visitId: number
  /** Pre-treatment vitals — taken before the procedure begins. Used by the
   *  doctor progress note's `vitalsSnapshot`. */
  preTreatmentVitals?: DoctorProgressNoteVitals
  vitals?: FlowSheetMobileVitals
  bpSite?: string
  method?: string
  machine?: string
  pain?: string
  painDetails?: FlowSheetPainDetails
  fallRisk?: string
  highFallRisk?: boolean
  /** Morse Fall Scale per-question values from the last fall-risk save (§9.1.5). */
  morseValues?: {
    a: number | null
    b: number | null
    c: number | null
    d: number | null
    e: number | null
    f: number | null
  }
  /** Sum of `morseValues.a..f`. */
  morseTotal?: number
  outsideDialysis?: boolean
  alarmsTest?: boolean
  nursingActions?: FlowSheetNursingAction[]
  dialysisParams?: FlowSheetDialysisParam[]
  intake?: string
  output?: string
  car?: FlowSheetCar
  dialysate?: FlowSheetDialysate
  access?: string
  anticoagType?: string
  /** Per-medication administration record from the last meds save (§9.1.14).
   *  Keyed by medication id. */
  medAdmin?: Record<number, FlowSheetMedicationAdmin>
  postTx?: FlowSheetMobilePostTx
  patientSignature?: StoredSignature
  nurseSignature?: StoredSignature
  submittedAt?: string // ISO 8601
}
