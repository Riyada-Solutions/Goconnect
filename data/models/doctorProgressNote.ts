export interface DoctorProgressNoteVitals {
  temperature?: string
  respiratoryRate?: string
  oxygenSaturation?: string
  bloodPressure?: string
  pulseRate?: string
  preWeight?: string
  dryWeight?: string
  ufGoal?: string
  rbs?: string
}

export interface DoctorProgressNote {
  id: number
  visitId: number
  note: string
  vitalsSnapshot?: DoctorProgressNoteVitals
  isAddendum: boolean
  parentNoteId?: number
  author: string
  createdAt: string
}

export interface DoctorProgressNoteInput {
  visitId: number
  note: string
  isAddendum: boolean
  parentNoteId?: number
}
