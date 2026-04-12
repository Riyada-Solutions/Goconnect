export interface Patient {
  id: number
  name: string
  dob: string
  gender: string
  phone: string
  email: string
  address: string
  bloodType: string
  status: 'active' | 'inactive' | 'critical'
  lastVisit: string
  diagnosis: string
}

export interface PatientAlert {
  allergies: { type: string; value: string }[]
  contamination: string[]
  instructions: string
  isolation: string
}
