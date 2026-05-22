export type ReferralStatus = "active" | "in_progress" | "closed" | "cancelled"

export interface ReferralPrintOptions {
  monthlyMedicalReport: boolean
  systemMedicalReport: boolean
  labResult: boolean
  last3FlowSheets: boolean
}

/**
 * Referral as returned in `visit.referrals[]`. Snake_case keys on the wire
 * are translated to camelCase here. `attachmentUrl` / `attachmentName` are
 * present when the nurse uploaded a file; both are `null` otherwise.
 */
export interface Referral {
  id: number
  visitId: number
  referralDate: string                // YYYY-MM-DD
  referralType: string
  otherReferralType: string | null
  referralHospitalId: number | null
  referralHospitalName: string | null
  referralReason: string
  referralBy: string
  primaryPhysician: string
  completionDate: string
  status: ReferralStatus
  comments: string | null
  printOptions: ReferralPrintOptions
  attachmentUrl: string | null
  attachmentName: string | null
  createdAt: string                   // ISO 8601
}

/**
 * Body passed to `submitReferral`. The repo translates this to the wire
 * shape (snake_case + multipart attachment) inside `submitReferral`.
 */
export interface ReferralInput {
  visitId: number
  referralDate: string
  referralType: string
  otherReferralType?: string | null
  referralHospitalId: number
  referralReason: string
  referralBy: string
  primaryPhysician: string
  completionDate: string
  status: ReferralStatus
  comments?: string
  printOptions: ReferralPrintOptions
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

/**
 * Local hospital catalog. The `id` values must match the backend's
 * `referral_hospital_id`. The only verified id so far is 9 → Aseer Central
 * Hospital (from a real visit response); the others are placeholders that
 * should be replaced with values from a real hospitals endpoint when one is
 * wired up.
 */
export const REFERRAL_HOSPITALS: ReadonlyArray<{ id: number; name: string }> = [
  { id: 1, name: "King Fahd Medical City" },
  { id: 2, name: "King Khalid University Hospital" },
  { id: 3, name: "King Faisal Specialist Hospital" },
  { id: 4, name: "Security Forces Hospital" },
  { id: 5, name: "National Guard Hospital" },
  { id: 9, name: "Aseer Central Hospital" },
]
