import type { CareTeamMember } from './careTeam'
import type { Patient } from './patient'

/**
 * Real API exposes a small core subset; the legacy mock fields (provider,
 * hospital, insurance, careTeam, etc.) are kept optional so existing screens
 * don't break while they get migrated off them.
 */
export interface Slot {
  id: string | number
  patientId?: string | number
  patientName?: string
  patientMrn?: string
  /** ISO date `YYYY-MM-DD`. */
  date?: string
  /** Start time `HH:mm`. */
  time: string
  /** End time `HH:mm`. */
  endTime: string
  /** Live status values: `new`, `waiting`, `confirmed`, `canceled`,
   *  `checked_in`, `completed`. Kept loose to absorb backend churn. */
  status: string
  isConfirmed?: boolean
  instructions?: string
  nurseId?: string | number

  // Legacy mock-only fields (still referenced by some screens) — all optional.
  phone?: string
  address?: string
  type?: string
  provider?: string
  visitDate?: string
  procedureTime?: string
  visitTime?: string
  hospital?: string
  insurance?: string
  doctorTime?: string
  careTeam?: CareTeamMember[]

  /** Embedded patient record so the appointment detail screen can render the
   *  patient hero card without a second `/patients/{id}` request. `null` for
   *  slots without a patient (e.g. provider breaks). */
  patient?: Patient | null
}
