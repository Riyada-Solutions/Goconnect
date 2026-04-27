import type { CareTeamMember } from './careTeam'

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
}
