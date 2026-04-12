export interface MedicalTeamMember {
  name: string
  role: string
  phone: string
}

export interface Slot {
  id: number
  patientName?: string
  patientId?: number
  phone?: string
  address?: string
  time: string
  endTime: string
  type: string
  status: 'confirmed' | 'pending' | 'cancelled'
  provider: string
  notes: string
  visitDate: string
  procedureTime: string
  visitTime: string
  hospital: string
  insurance: string
  doctorTime: string
  medicalTeam: MedicalTeamMember[]
}
