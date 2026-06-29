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
  /** Pre-uploaded file token returned by POST /signatures/upload. When set, the
   *  referral submit sends `attachment_signature_url` instead of the binary file. */
  attachmentSignatureUrl?: string
}

export const REFERRAL_TYPES = [
  "Emergency",
  "Elective",
  "Other",
] as const

