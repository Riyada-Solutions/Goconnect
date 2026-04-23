export type SariAnswer = "yes" | "no" | null
export type SariActionStatus = "done" | "not_done" | null

export interface SariFeatures {
  fever: SariAnswer
  coughOrBreathing: SariAnswer
  radiographicEvidence: SariAnswer
}

export interface SariExposure {
  closeContactSari: SariAnswer
  travelToPhacNotice: SariAnswer
  recentExposurePotentialSource: SariAnswer
  inconsistentWithOtherKnownCause: SariAnswer
}

export interface SariActions {
  thinkInfectionControl: SariActionStatus
  tellMedicalHealthOfficer: SariActionStatus
  tellInfectionControl: SariActionStatus
  consultInfectiousDiseaseSpecialist: SariActionStatus
  test: SariActionStatus
}

export interface SariScreening {
  id: number
  visitId: number
  addressographPatientName: string
  dateTime: string // ISO 8601
  sariFeatures: SariFeatures
  exposureCriteria: SariExposure
  actions: SariActions
  author: string
  createdAt: string
}

export interface SariScreeningInput {
  visitId: number
  addressographPatientName: string
  dateTime: string
  sariFeatures: SariFeatures
  exposureCriteria: SariExposure
  actions: SariActions
}

export const EMPTY_SARI_FEATURES: SariFeatures = {
  fever: null,
  coughOrBreathing: null,
  radiographicEvidence: null,
}

export const EMPTY_SARI_EXPOSURE: SariExposure = {
  closeContactSari: null,
  travelToPhacNotice: null,
  recentExposurePotentialSource: null,
  inconsistentWithOtherKnownCause: null,
}

export const EMPTY_SARI_ACTIONS: SariActions = {
  thinkInfectionControl: null,
  tellMedicalHealthOfficer: null,
  tellInfectionControl: null,
  consultInfectiousDiseaseSpecialist: null,
  test: null,
}
