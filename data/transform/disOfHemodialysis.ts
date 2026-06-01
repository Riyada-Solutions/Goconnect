import { EMPTY_PARTY, EMPTY_REFUSAL_SIDE, type PartyInfo, type RefusalSide, type RefusalType } from "../models/refusal"

/**
 * Wire shape for `GET/POST /api/visits/{id}/forms/dis-of-hemodialysis`.
 *
 * The backend flattens both language sides into a single object keyed by
 * `<field>_en` / `<field>_ar`. Risk checkboxes are duplicated per language
 * (a patient may tick a risk on the English copy but not the Arabic — they
 * are independent acknowledgements, not translations of one another).
 *
 * Signatures come in two flavours:
 *   • Drawn (witness / relative / interpreter): the PNG is uploaded
 *     separately via POST /signatures/upload and the URL is stored on
 *     `<role>_signature_signature_url` / `<role>_signature_ar_signature_url`.
 *   • Typed (doctor only): the doctor's name itself is the signature, stored
 *     directly on `doctor_signature` / `doctor_signature_ar`.
 *
 * Save-time invariant — the server validates every `_ar` and `_en` field
 * as `required`, even when the user only filled one language side. The
 * serializer therefore mirrors non-empty values from the populated side onto
 * the empty one (and writes default labels for the few hard-required template
 * fields like `doctor_name_*`, `witness_address_*`).
 */
export type DisOfHemodialysisWire = Record<string, unknown>

// Default template labels the server expects to round-trip on every save.
const DEFAULT_LABELS = {
  doctor_name_en:                        "Name of Doctor:",
  doctor_name_ar:                        "اسم الطبيب:",
  witness_signature_signature_name:      "Signature Name:",
  witness_signature_ar_signature_name:   "Signature Name:",
  relative_signature_signature_name:     "Signature Name:",
  relative_signature_ar_signature_name:  "Signature Name:",
  interpreter_signature_signature_name:  "Signature Name:",
  interpreter_signature_ar_signature_name: "Signature Name:",
  witness_address_en:                    "Address:",
  witness_address_ar:                    "Address:",
  others_en:                             "Others (Please Specify):\n",
  others_ar:                             "أخرى (يرجى التحديد):\n",
  inability_reason_en:                   "Reason:\n",
  inability_reason_ar:                   "سبب عدم قدرة المريض على الموافقة\n",
} as const

/**
 * Format an ISO / datetime-local timestamp as `YYYY/MM/DD hh:mm AM/PM`
 * (e.g. `"2026/05/24 01:00 PM"`) to match the server's `*_signed_at` shape.
 */
function formatSignedAt(value: string | undefined | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  let hours = d.getHours()
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12 || 12
  return `${yyyy}/${mm}/${dd} ${pad(hours)}:${pad(d.getMinutes())} ${ampm}`
}

/**
 * Format an ISO timestamp as `YYYY-MM-DDTHH:mm` (datetime-local), to match
 * the server's `*_datetime_*` shape (no seconds, no `Z`).
 */
function formatDatetimeLocal(value: string | undefined | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const str = (v: unknown): string => (typeof v === "string" ? v : "")
const bool = (v: unknown): boolean => v === true || v === "true" || v === 1 || v === "1"
const num = (v: unknown): number | undefined =>
  typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : undefined

const cloneSide = (s: RefusalSide): RefusalSide => JSON.parse(JSON.stringify(s))

// =============================================================================
// PARSE  —  wire ➜ form view-model
// =============================================================================

/** Parse the flat wire shape into the form's `{en, ar}` view-model. */
export function parseDisOfHemodialysis(
  value: DisOfHemodialysisWire | null | undefined,
): { en: RefusalSide; ar: RefusalSide } {
  if (!value || typeof value !== "object") {
    return { en: cloneSide(EMPTY_REFUSAL_SIDE), ar: cloneSide(EMPTY_REFUSAL_SIDE) }
  }
  return {
    en: parseFlatSide(value, "en"),
    ar: parseFlatSide(value, "ar"),
  }
}

const parseFlatSide = (raw: DisOfHemodialysisWire, suffix: "en" | "ar"): RefusalSide => {
  const sx = `_${suffix}`
  const get = (key: string) => raw[`${key}${sx}`]

  const types: RefusalType[] = []
  if (bool(get("discontinue_hemodialysis_services"))) types.push("discontinuation")
  if (bool(get("examination_refusal"))) types.push("refusal_consent")

  // ---- Witness (drawn) ----
  const wSig = suffix === "ar" ? "witness_signature_ar" : "witness_signature"
  const witness: PartyInfo = {
    ...EMPTY_PARTY,
    name:               str(raw[`${wSig}_signature_name`]),
    relationship:       str(get("witness_relationship")) || "",
    customRelationship: str(raw[`custom_witness_relation${suffix === "ar" ? "_ar" : ""}`]),
    // Actual address lives on `patient_address_*`; `witness_address_*` is a
    // server-side label ("Address:") and not a user value.
    address:            str(get("patient_address")),
    signed:             false,
  }
  const wUrl = str(raw[`${wSig}_signature_url`])
  if (wUrl) { witness.signatureUrl = wUrl; witness.signed = true }
  const wAt = str(get("witness_datetime")) || str(raw[`${wSig}_signed_at`])
  if (wAt) witness.signedAt = wAt

  // ---- Relative (drawn) ----
  const rSig = suffix === "ar" ? "relative_signature_ar" : "relative_signature"
  const relative: PartyInfo = {
    ...EMPTY_PARTY,
    name:               str(raw[`${rSig}_signature_name`]),
    relationship:       str(get("relative_relation")) || "",
    customRelationship: str(raw[`custom_relative_relation${suffix === "ar" ? "_ar" : ""}`]),
    address:            undefined,
    signed:             false,
  }
  const rUrl = str(raw[`${rSig}_signature_url`])
  if (rUrl) { relative.signatureUrl = rUrl; relative.signed = true }
  const rAt = str(get("relative_datetime")) || str(raw[`${rSig}_signed_at`])
  if (rAt) relative.signedAt = rAt

  // ---- Doctor (typed) ----
  const dSig = suffix === "ar" ? "doctor_signature_ar" : "doctor_signature"
  const doctorName = str(raw[dSig])
  const doctor: PartyInfo = {
    ...EMPTY_PARTY,
    name:           doctorName,
    relationship:   undefined,
    address:        undefined,
    signatureLabel: doctorName || undefined,
    signed:         !!doctorName,
  }
  const dAt = str(get("doctor_datetime")) || str(raw[`${dSig}_signed_at`])
  if (dAt) doctor.signedAt = dAt
  const dBy = num(raw[`${dSig}_signed_by`])
  if (dBy !== undefined) doctor.signedById = dBy

  // ---- Interpreter (drawn) ----
  const iSig = suffix === "ar" ? "interpreter_signature_ar" : "interpreter_signature"
  const interpreter: PartyInfo = {
    ...EMPTY_PARTY,
    name:         str(raw[`${iSig}_signature_name`]),
    relationship: undefined,
    address:      undefined,
    signed:       false,
  }
  const iUrl = str(raw[`${iSig}_signature_url`])
  if (iUrl) { interpreter.signatureUrl = iUrl; interpreter.signed = true }
  const iAt = str(get("interpreter_datetime")) || str(raw[`${iSig}_signed_at`])
  if (iAt) interpreter.signedAt = iAt

  // Treat the server's placeholder labels as empty so the form doesn't show
  // them as if the user had typed them.
  const stripLabel = (raw: string, label: string) => (raw.trim() === label.trim() ? "" : raw)
  const inabilityLabel = suffix === "ar"
    ? "سبب عدم قدرة المريض على الموافقة"
    : "Reason:"
  const othersLabel = suffix === "ar"
    ? "أخرى (يرجى التحديد):"
    : "Others (Please Specify):"

  return {
    types,
    reason:             str(get("discontinue_reason")),
    unableToSignReason: stripLabel(str(get("inability_reason")), inabilityLabel),
    risks: {
      hyperkalemia:   bool(get("hyperkalemia")),
      cardiacArrest:  bool(get("cardiac")),
      pulmonaryEdema: bool(get("pulmonary")),
      severeAcidosis: bool(get("acidosis")),
      others:         stripLabel(str(get("others")), othersLabel),
    },
    witness,
    relative,
    doctor,
    interpreter,
  }
}

// =============================================================================
// SERIALIZE  —  form view-model ➜ wire
// =============================================================================

export interface SerializeOpts {
  /** Numeric server-side user id of the currently authenticated nurse — used
   *  to satisfy `doctor_signature_signed_by` / `doctor_signature_ar_signed_by`. */
  currentUserId: number
}

/** Serialize `{en, ar}` back to the flat wire shape for POST. */
export function serializeDisOfHemodialysis(
  enIn: RefusalSide,
  arIn: RefusalSide,
  opts: SerializeOpts,
): DisOfHemodialysisWire {
  // Mirror non-empty values across sides so the server's per-field `required`
  // rules pass even when the nurse filled only one language.
  const [en, ar] = mirrorSides(enIn, arIn)
  const out: DisOfHemodialysisWire = { ...DEFAULT_LABELS }
  writeSide(out, en, ar, "en", opts)
  writeSide(out, ar, en, "ar", opts)

  // Custom-relation companion fields — empty string when no "Other" was
  // chosen. The server expects the key to exist but be blank in that case
  // (it only validates when the relationship is "Other").
  out.custom_witness_relation     = en.witness.customRelationship  ?? ""
  out.custom_witness_relation_ar  = ar.witness.customRelationship  ?? ""
  out.custom_relative_relation    = en.relative.customRelationship ?? ""
  out.custom_relative_relation_ar = ar.relative.customRelationship ?? ""
  return out
}

/**
 * Per-field mirror: any empty field on one side inherits from the other.
 * Booleans use OR (a risk acknowledged in either language survives). Party
 * signatures inherit URL/name/signed_at as a bundle so the AR side ends up
 * "signed" by the same upload.
 */
const mirrorSides = (a: RefusalSide, b: RefusalSide): [RefusalSide, RefusalSide] => [
  mirrorOne(a, b),
  mirrorOne(b, a),
]

const mirrorOne = (self: RefusalSide, other: RefusalSide): RefusalSide => ({
  types: self.types.length ? self.types : other.types,
  reason:             self.reason             || other.reason,
  unableToSignReason: self.unableToSignReason || other.unableToSignReason,
  risks: {
    hyperkalemia:   self.risks.hyperkalemia   || other.risks.hyperkalemia,
    cardiacArrest:  self.risks.cardiacArrest  || other.risks.cardiacArrest,
    pulmonaryEdema: self.risks.pulmonaryEdema || other.risks.pulmonaryEdema,
    severeAcidosis: self.risks.severeAcidosis || other.risks.severeAcidosis,
    others:         self.risks.others         || other.risks.others,
  },
  witness:     mirrorParty(self.witness,     other.witness),
  relative:    mirrorParty(self.relative,    other.relative),
  doctor:      mirrorParty(self.doctor,      other.doctor),
  interpreter: mirrorParty(self.interpreter, other.interpreter),
})

const mirrorParty = (self: PartyInfo, other: PartyInfo): PartyInfo => {
  const useOtherSig = !self.signed && other.signed
  return {
    ...self,
    name:               self.name               || other.name,
    relationship:       self.relationship       ?? other.relationship,
    customRelationship: self.customRelationship || other.customRelationship,
    address:            self.address            ?? other.address,
    signed:             self.signed || other.signed,
    signedAt:           self.signedAt || other.signedAt,
    signatureUrl:       useOtherSig ? other.signatureUrl   : self.signatureUrl,
    signatureData:      useOtherSig ? other.signatureData  : self.signatureData,
    signatureLabel:     self.signatureLabel || other.signatureLabel,
    signedById:         self.signedById ?? other.signedById,
  }
}

const writeSide = (
  out: DisOfHemodialysisWire,
  side: RefusalSide,
  _other: RefusalSide,
  suffix: "en" | "ar",
  opts: SerializeOpts,
) => {
  const sx = `_${suffix}`
  const set = (key: string, v: unknown) => { out[`${key}${sx}`] = v }

  set("discontinue_hemodialysis_services", side.types.includes("discontinuation"))
  set("examination_refusal",                side.types.includes("refusal_consent"))
  set("discontinue_reason",  side.reason)
  // `inability_reason_*` defaults to a server-side label when the user hasn't
  // typed a reason, mirroring the GET shape.
  set(
    "inability_reason",
    side.unableToSignReason ||
      (suffix === "ar" ? DEFAULT_LABELS.inability_reason_ar : DEFAULT_LABELS.inability_reason_en),
  )
  // Patient address holds the user-entered address. `witness_address_*` is
  // a server label ("Address:") and is not a user-editable field.
  set("patient_address",     side.witness.address ?? "")
  set("witness_address",     suffix === "ar" ? DEFAULT_LABELS.witness_address_ar : DEFAULT_LABELS.witness_address_en)
  set("hyperkalemia", side.risks.hyperkalemia)
  set("cardiac",      side.risks.cardiacArrest)
  set("pulmonary",    side.risks.pulmonaryEdema)
  set("acidosis",     side.risks.severeAcidosis)
  // `others_*` defaults to the bilingual placeholder label when blank.
  set(
    "others",
    side.risks.others ||
      (suffix === "ar" ? DEFAULT_LABELS.others_ar : DEFAULT_LABELS.others_en),
  )

  // Witness
  set("witness_relationship", side.witness.relationship ?? "")
  set("witness_datetime",     formatDatetimeLocal(side.witness.signedAt))
  const wSig = suffix === "ar" ? "witness_signature_ar" : "witness_signature"
  out[`${wSig}_signature_url`]  = side.witness.signatureUrl ?? ""
  out[`${wSig}_signature_name`] = side.witness.name || DEFAULT_LABELS.witness_signature_signature_name
  out[`${wSig}_signed_at`]      = formatSignedAt(side.witness.signedAt)

  // Relative
  set("relative_relation",  side.relative.relationship ?? "")
  set("relative_datetime",  formatDatetimeLocal(side.relative.signedAt))
  const rSig = suffix === "ar" ? "relative_signature_ar" : "relative_signature"
  out[`${rSig}_signature_url`]  = side.relative.signatureUrl ?? ""
  out[`${rSig}_signature_name`] = side.relative.name || DEFAULT_LABELS.relative_signature_signature_name
  out[`${rSig}_signed_at`]      = formatSignedAt(side.relative.signedAt)

  // Doctor (typed; the name IS the signature, plus signed_by/_at audit)
  const dSig = suffix === "ar" ? "doctor_signature_ar" : "doctor_signature"
  set("doctor_datetime", formatDatetimeLocal(side.doctor.signedAt))
  out[dSig]                 = side.doctor.signatureLabel || side.doctor.name || ""
  out[`${dSig}_signed_at`]  = formatSignedAt(side.doctor.signedAt)
  out[`${dSig}_signed_by`]  = side.doctor.signedById ?? opts.currentUserId

  // Interpreter
  set("interpreter_datetime", formatDatetimeLocal(side.interpreter.signedAt))
  const iSig = suffix === "ar" ? "interpreter_signature_ar" : "interpreter_signature"
  out[`${iSig}_signature_url`]  = side.interpreter.signatureUrl ?? ""
  out[`${iSig}_signature_name`] = side.interpreter.name || DEFAULT_LABELS.interpreter_signature_signature_name
  out[`${iSig}_signed_at`]      = formatSignedAt(side.interpreter.signedAt)
}
