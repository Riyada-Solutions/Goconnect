import type { DoctorProgressNote, DoctorProgressNoteVitals } from './doctorProgressNote'
import type { FlowSheet } from './flowSheet'
import type { NursingProgressNote } from './nursingProgressNote'
import type { Referral } from './referral'
import type { Refusal } from './refusal'
import type { SocialWorkerProgressNote } from './socialWorkerProgressNote'

export interface MedicalTeamMember {
  name: string
  role: string
  phone?: string
}

export interface Visit {
  id: number
  patientName: string
  patientId: number
  phone: string
  date: string
  time: string
  type: string
  status: 'completed' | 'pending' | 'confirmed' | 'cancelled' | 'in_progress' | 'start_procedure' | 'end_procedure'
  provider: string
  notes: string
  diagnosis: string
  address: string
  duration: number
  medicalTeam?: MedicalTeamMember[]
  nursingProgressNotes?: NursingProgressNote[]
  socialWorkerProgressNotes?: SocialWorkerProgressNote[]
  referrals?: Referral[]
  doctorProgressNotes?: DoctorProgressNote[]
  preTreatmentVitals?: DoctorProgressNoteVitals
  refusals?: Refusal[]
  flowSheet?: FlowSheet
}

export interface DialysisMedication {
  id: number
  drugName: string
  form: string
  dosage: string
  frequency: string
  route: string
  duration: string
  durationPeriod: string
  adminType: string
  instructions: string
}

export interface InventoryItem {
  id: number
  name: string
  itemNumber: string
  available: number
}
