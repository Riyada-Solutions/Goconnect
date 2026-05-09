import type { CareTeamMember } from './careTeam'

export const PatientStatus = {
  Active: 'active',
  Inactive: 'inactive',
} as const
export type PatientStatus = (typeof PatientStatus)[keyof typeof PatientStatus]

/**
 * Patient summary as returned by the live API. Many fields the legacy mock
 * code relied on (address, careTeam, lastVisit, diagnosis, etc.) are not in
 * the real list response and may be missing.
 */
export interface Patient {
  /** Backend returns IDs as strings; we keep the union so legacy numeric IDs
   *  still type-check against this model. */
  id: string | number
  patientId?: string
  mrn: string
  name: string
  dob: string | null
  gender: string | null
  phone: string | null
  email: string | null
  address?: string
  location?: string
  bloodType: string | null
  codeStatus: string | null
  treatmentHoliday?: boolean
  status: PatientStatus
  lastVisit?: string
  diagnosis?: string
  avatarUrl?: string | null
  careTeam?: CareTeamMember[]
}

/**
 * Alert event surfaced by `GET /patients/{id}/alerts`. Each entry is an
 * activity log item (lab order added, lab result ready, appointment update,
 * etc.) rather than the static allergies/isolation summary the legacy code
 * expected.
 */
export interface PatientAlert {
  id: string | number
  /** High-level category, e.g. `lab` or `appointment`. */
  type: string
  /** Specific event, e.g. `lab_order`, `lab_result`, `appointment`. */
  actionType: string
  /** ISO timestamp. */
  date: string
  message: string
  /** Server-defined extra payload; varies per action type. */
  data?: unknown
}

/** Legacy alert summary shape (kept for screens that have not migrated). */
export interface PatientAlertSummary {
  allergies?: { type: string; value: string }[]
  contamination?: string[]
  instructions?: string
  isolation?: string
}
