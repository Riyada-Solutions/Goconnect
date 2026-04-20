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

export interface FlowSheet {
  visitId: number
  // Shared
  painScore: string
  fallRisk: string
  intake: string
  output: string
  accessType: string
  outsideDialysis: boolean
  alarmsTestPassed: boolean
  machine: string
  highRisk: boolean
  physicianNotified: boolean
  painDetails: FlowSheetPainDetails

  // Desktop flow sheet
  vitals: FlowSheetVitals
  nursingActions: FlowSheetNursingAction[]
  dialysisParams: FlowSheetDialysisParam[]
  car: FlowSheetCar
  dialysate: FlowSheetDialysate
  anticoagType: string
  postTx: FlowSheetPostTx

  // Mobile flow sheet
  mobile: {
    vitals: FlowSheetMobileVitals
    pain: string
    fallRisk: string
    intake: string
    output: string
    access: string
    outsideDialysis: boolean
    alarmsTest: boolean
    highFallRisk: boolean
    bpSite: string
    method: string
    machine: string
    nursingActions: FlowSheetNursingAction[]
    dialysisParams: FlowSheetDialysisParam[]
    car: FlowSheetCar
    dialysate: FlowSheetDialysate
    anticoagType: string
    postTx: FlowSheetMobilePostTx
    painDetails: FlowSheetPainDetails
  }

  morse: MorseFallScale

  medAdmin: Record<number, { status: 'yes' | 'no' | null; timestamp: string; reason: string }>

  signatures: {
    patientSigned: boolean
    nurseSigned: boolean
  }

  procedureStartTime: string
  procedureEndTime: string
}
