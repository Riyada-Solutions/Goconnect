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
  /** Free-text relation used when `relationship === 'Other'`. Mirrors the
   *  `custom_*_relation` keys on the wire. */
  customRelationship?: string
  signed: boolean
  signedAt?: string // ISO datetime
  /** Local-only: PNG data URL captured by SignaturePad. Stripped before
   *  sending — the bytes ride the matching `*_signature_url` upload. */
  signatureData?: string
  /** Server-returned URL of the stored PNG. */
  signatureUrl?: string
  /** Typed signature label (used by the doctor party — they type a name
   *  rather than draw). Maps to `doctor_signature` / `doctor_signature_ar`. */
  signatureLabel?: string
  /** Server-side user id who signed. Read-only; we round-trip it on save. */
  signedById?: number
  address?: string
}

/**
 * One language side of the bilingual "Discontinuation of Hemodialysis"
 * (formerly: Refusal) form. The wire format flattens `en` and `ar` together
 * using `_en` / `_ar` suffixes (see `data/transform/disOfHemodialysis.ts`).
 */
export interface RefusalSide {
  types: RefusalType[]
  /** Reason for discontinuation (`discontinue_reason_*` on the wire). */
  reason: string
  risks: RefusalRisks
  /** Witness section. The address typed here maps to the wire's
   *  `patient_address_*` field (`witness_address_*` carries the static label
   *  rendered above the input). */
  witness: PartyInfo
  /** Reason the patient is unable to sign personally (`inability_reason_*`). */
  unableToSignReason: string
  relative: PartyInfo
  doctor: PartyInfo
  interpreter: PartyInfo
}

export interface Refusal {
  id: number
  visitId: number
  en: RefusalSide
  ar: RefusalSide
  author?: string
  createdAt?: string
}

export interface RefusalInput {
  visitId: number
  /** Authenticated nurse's numeric user id — needed for the server's
   *  `doctor_signature_signed_by` / `..._ar_signed_by` audit columns. */
  currentUserId: number
  en: RefusalSide
  ar: RefusalSide
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
  customRelationship: "",
  signed: false,
  signedAt: undefined,
  address: "",
}

export const EMPTY_REFUSAL_SIDE: RefusalSide = {
  types: [],
  reason: "",
  risks: { ...EMPTY_RISKS },
  witness: { ...EMPTY_PARTY },
  unableToSignReason: "",
  relative: { ...EMPTY_PARTY },
  doctor: { ...EMPTY_PARTY, relationship: undefined, address: undefined },
  interpreter: { ...EMPTY_PARTY, relationship: undefined, address: undefined },
}
