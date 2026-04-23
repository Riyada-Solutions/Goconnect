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

export interface SavedSignature {
  dataUrl: string // base64 PNG data URI
  signedAt: string // ISO 8601
}

/**
 * Flow Sheet submission — contains the full mobile form payload plus the
 * optional patient/nurse signatures captured in Post Treatment Assessment.
 */
export interface FlowSheet {
  visitId: number
  vitals: FlowSheetMobileVitals
  bpSite: string
  method: string
  machine: string
  pain: string
  painDetails: FlowSheetPainDetails
  fallRisk: string
  highFallRisk: boolean
  outsideDialysis: boolean
  alarmsTest: boolean
  nursingActions: FlowSheetNursingAction[]
  dialysisParams: FlowSheetDialysisParam[]
  intake: string
  output: string
  car: FlowSheetCar
  dialysate: FlowSheetDialysate
  access: string
  anticoagType: string
  postTx: FlowSheetMobilePostTx
  patientSignature?: SavedSignature
  nurseSignature?: SavedSignature
  submittedAt: string // ISO 8601
}
