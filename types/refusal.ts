export type RefusalType = "discontinuation" | "refusal_consent"

export interface RefusalRisks {
  hyperkalemia: boolean
  cardiacArrest: boolean
  pulmonaryEdema: boolean
  severeAcidosis: boolean
  others: string
}

export interface PartyInfo {
  name: string
  relationship?: string
  signed: boolean
  signedAt?: string // ISO datetime
  signatureData?: string // SVG path data
  address?: string
}

export interface Refusal {
  id: number
  visitId: number
  types: RefusalType[]
  reason: string
  risks: RefusalRisks
  witness: PartyInfo
  unableToSignReason: string
  relative: PartyInfo
  doctor: PartyInfo
  interpreter: PartyInfo
  author: string
  createdAt: string
}

export interface RefusalInput {
  visitId: number
  types: RefusalType[]
  reason: string
  risks: RefusalRisks
  witness: PartyInfo
  unableToSignReason: string
  relative: PartyInfo
  doctor: PartyInfo
  interpreter: PartyInfo
}

export const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Guardian",
  "Other",
] as const

export const EMPTY_RISKS: RefusalRisks = {
  hyperkalemia: false,
  cardiacArrest: false,
  pulmonaryEdema: false,
  severeAcidosis: false,
  others: "",
}

export const EMPTY_PARTY: PartyInfo = {
  name: "",
  relationship: "",
  signed: false,
  signedAt: undefined,
  address: "",
}
