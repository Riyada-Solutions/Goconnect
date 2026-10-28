import type { ProgressNoteLocation } from "./socialWorkerProgressNote"

export interface DoctorProgressNoteVitals {
  temperature?: string
  respiratoryRate?: string
  oxygenSaturation?: string
  bloodPressure?: string
  pulseRate?: string
  height?: string
  preWeight?: string
  dryWeight?: string
  ufGoal?: string
  rbs?: string
}

export interface DoctorProgressNote {
  id: number
  visitId: number
  note: string
  /** Missing on notes saved before the doctor form sent a location. */
  location?: ProgressNoteLocation
  vitalsSnapshot?: DoctorProgressNoteVitals
  isAddendum: boolean
  parentNoteId?: number
  author: string
  createdAt: string
}

export interface DoctorProgressNoteInput {
  visitId: number
  note: string
  location: ProgressNoteLocation
  isAddendum: boolean
  parentNoteId?: number
}
