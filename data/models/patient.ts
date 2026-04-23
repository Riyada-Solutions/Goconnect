import type { CareTeamMember } from './careTeam'

export const PatientStatus = {
  Active: 'active',
  Inactive: 'inactive',
} as const
export type PatientStatus = (typeof PatientStatus)[keyof typeof PatientStatus]

export interface Patient {
  id: number
  patientId: string
  mrn: string
  name: string
  dob: string
  gender: string
  phone: string
  email: string
  address: string
  location: string
  bloodType: string
  codeStatus: string
  treatmentHoliday: boolean
  status: PatientStatus
  lastVisit: string
  diagnosis: string
  avatarUrl?: string | null
  careTeam: CareTeamMember[]
}

export interface PatientAlert {
  allergies: { type: string; value: string }[]
  contamination: string[]
  instructions: string
  isolation: string
}
