import type { CareTeamMember } from './careTeam'
import type { Patient } from './patient'

export interface Slot {
  id: number
  patientName?: string
  patientId?: number
  phone?: string
  address?: string
  time: string
  endTime: string
  type: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'checked_in'
  provider: string
  instructions: string
  visitDate: string
  procedureTime: string
  visitTime: string
  hospital: string
  insurance: string
  doctorTime: string
  careTeam: CareTeamMember[]

  /** Embedded patient record so the appointment detail screen can render the
   *  patient hero card without a second `/patients/{id}` request. `null` for
   *  slots without a patient (e.g. provider breaks). */
  patient?: Patient | null
}
