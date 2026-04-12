export interface MedicalTeamMember {
  name: string;
  role: string;
  phone?: string;
}

export interface Visit {
  id: number;
  patientName: string;
  patientId: number;
  phone: string;
  date: string;
  time: string;
  type: string;
  status: "completed" | "pending" | "confirmed" | "cancelled";
  provider: string;
  notes: string;
  diagnosis: string;
  address: string;
  duration: number;
  medicalTeam?: MedicalTeamMember[];
}

export interface DialysisMedication {
  id: number;
  drugName: string;
  form: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  durationPeriod: string;
  adminType: string;
  instructions: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  itemNumber: string;
  available: number;
}
