export type ReferralStatus = "Active" | "Completed" | "Cancelled"

export interface ReferralPrintOptions {
  monthlyMedicalReport: boolean
  systemMedicalReport: boolean
  labResult: boolean
  last3FlowSheets: boolean
}

export interface Referral {
  id: number
  visitId: number
  referralDate: string // YYYY-MM-DD
  primaryPhysician: string
  referralBy: string
  status: ReferralStatus
  referralType: string
  referralHospital: string
  printOptions: ReferralPrintOptions
  referralReason: string
  completionDate: string
  comments: string
  attachmentUri?: string
  attachmentName?: string
  createdAt: string
}

export interface ReferralInput {
  visitId: number
  referralDate: string
  referralType: string
  referralHospital: string
  printOptions: ReferralPrintOptions
  referralReason: string
  completionDate: string
  comments: string
  attachmentUri?: string
  attachmentName?: string
}

export const REFERRAL_TYPES = [
  "Outpatient",
  "Inpatient",
  "Emergency",
  "Follow-up",
  "Specialist Consult",
] as const

export const REFERRAL_HOSPITALS = [
  "King Fahd Medical City",
  "King Khalid University Hospital",
  "King Faisal Specialist Hospital",
  "Security Forces Hospital",
  "National Guard Hospital",
] as const
