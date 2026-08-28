/**
 * Patient Medications — contracts, option lists and the row/form helpers.
 *
 * The screen always runs in the context of one patient and one medication
 * `type`: `home_medications` (which has Refills) or `dialysis_medications`
 * (which has Administration Type and Duration Period instead). Everything
 * that differs between the two lives in this file, so the components only
 * ask "is this field visible for this type?".
 *
 * `end_date` is **always** computed by the server. The local calculation here
 * exists purely to show the nurse an instant preview, mirroring the web app.
 */

import { toOptionList, toStringList, type OptionItem } from './optionList'

export type MedicationType = 'home_medications' | 'dialysis_medications'

export const MEDICATION_TYPES: MedicationType[] = ['home_medications', 'dialysis_medications']

export type { OptionItem as MedicationOptionItem }

// ─── Wire shapes ────────────────────────────────────────────────────────────

/** `GET /medications/options` — static lookups, cached for a day. */
export interface MedicationOptions {
  forms: OptionItem[]
  routes: OptionItem[]
  frequencies: OptionItem[]
  durations: OptionItem[]
  durationPeriods: OptionItem[]
  administrationTypes: OptionItem[]
  administeredBy: OptionItem[]
  /** Durations that never end — an end-date preview of "ongoing". */
  indefiniteDurations: string[]
}

export interface Drug {
  id: number
  name: string
  code: string | null
  scientificName: string | null
  form: string | null
}

export interface PatientMedication {
  id: number
  type: MedicationType | string
  drug: Drug | null
  drugId: number | null
  form: string
  dosage: string
  frequency: string
  route: string
  duration: string
  durationPeriod: string
  administrationType: string
  quantity: string
  /** The API answers with a string; the request wants a number. */
  refills: number | null
  refillsUsed: number
  remainingRefills: number | null
  instructions: string
  startDate: string | null
  /** `null` = no end date — the course is ongoing. */
  endDate: string | null
  status: boolean
  isExpired: boolean
  /** Drives the Refill button directly — never re-derive it from dates. */
  canRefill: boolean
  lastDoseAt: string | null
  isAcknowledged: boolean
  administeredBy: string
  createdBy: { id: number | null; name: string } | null
  createdAt: string | null
  updatedAt: string | null
}

export interface MedicationRefillEntry {
  id: number
  refilledAt: string | null
  by: string
  notes: string
}

// ─── Mappers ────────────────────────────────────────────────────────────────

const str = (v: any): string => (v == null ? '' : String(v))

const numOrNull = (v: any): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function mapDrugFromApi(raw: any): Drug | null {
  if (!raw || typeof raw !== 'object') return null
  const id = numOrNull(raw.id)
  if (id == null) return null
  return {
    id,
    name: str(raw.name ?? raw.trade_name),
    code: raw.code != null ? str(raw.code) : null,
    scientificName: raw.scientific_name != null ? str(raw.scientific_name) : null,
    form: raw.form != null ? str(raw.form) : null,
  }
}

/** One-line identity for a drug: "Pantrox — PANTOPRAZOLE". */
export function drugLabel(drug: Drug | null | undefined): string {
  if (!drug) return ''
  return drug.scientificName ? `${drug.name} — ${drug.scientificName}` : drug.name
}

export function mapMedicationFromApi(raw: any): PatientMedication {
  const drug = mapDrugFromApi(raw?.drug)
  return {
    id: Number(raw?.id ?? 0),
    type: str(raw?.type),
    drug,
    drugId: numOrNull(raw?.drug_id) ?? drug?.id ?? null,
    form: str(raw?.form),
    dosage: str(raw?.dosage),
    frequency: str(raw?.frequency),
    route: str(raw?.route),
    duration: str(raw?.duration),
    durationPeriod: str(raw?.duration_period),
    administrationType: str(raw?.administration_type),
    quantity: str(raw?.quantity),
    refills: numOrNull(raw?.refills),
    refillsUsed: numOrNull(raw?.refills_used) ?? 0,
    remainingRefills: numOrNull(raw?.remaining_refills),
    instructions: str(raw?.instructions),
    startDate: raw?.start_date ? str(raw.start_date).slice(0, 10) : null,
    endDate: raw?.end_date ? str(raw.end_date).slice(0, 10) : null,
    status: raw?.status !== false && raw?.status !== 0 && raw?.status !== '0',
    isExpired: !!raw?.is_expired,
    canRefill: !!raw?.can_refill,
    lastDoseAt: raw?.last_dose_at ? str(raw.last_dose_at) : null,
    isAcknowledged: !!raw?.is_acknowledged,
    administeredBy: str(raw?.administered_by),
    createdBy: raw?.created_by
      ? { id: numOrNull(raw.created_by.id), name: str(raw.created_by.name ?? raw.created_by) }
      : null,
    createdAt: raw?.created_at ? str(raw.created_at) : null,
    updatedAt: raw?.updated_at ? str(raw.updated_at) : null,
  }
}

export function mapRefillFromApi(raw: any, index = 0): MedicationRefillEntry {
  return {
    id: numOrNull(raw?.id) ?? index,
    refilledAt: raw?.refilled_at ?? raw?.created_at ?? null,
    by: str(raw?.refilled_by?.name ?? raw?.refilled_by ?? raw?.created_by?.name ?? raw?.user?.name),
    notes: str(raw?.notes),
  }
}

export function mapMedicationOptionsFromApi(raw: any): MedicationOptions {
  const src = raw ?? {}
  return {
    forms: toOptionList(src.forms),
    routes: toOptionList(src.routes),
    frequencies: toOptionList(src.frequencies),
    durations: toOptionList(src.durations),
    durationPeriods: toOptionList(src.duration_periods),
    administrationTypes: toOptionList(src.administration_types),
    administeredBy: toOptionList(src.administered_by),
    indefiniteDurations: toStringList(src.indefinite_durations),
  }
}

/** Stands in until the real payload lands (a first-ever open while offline). */
export const FALLBACK_MEDICATION_OPTIONS: MedicationOptions = {
  forms: toOptionList(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ampoule', 'Vial', 'Cream', 'Drops']),
  routes: toOptionList(['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation']),
  frequencies: toOptionList([
    'Once daily',
    'Twice daily (BID)',
    'Three times daily (TID)',
    'Every 8 hours',
    'Three times weekly',
    'As needed (PRN)',
  ]),
  durations: toOptionList([
    'Single dose',
    '7 days (1 week)',
    '14 days (2 weeks)',
    '30 days (1 month)',
    '90 days (3 months)',
    'Until cancelled / chronic',
    'Until next visit',
    'As directed by physician',
  ]),
  durationPeriods: toOptionList(['Day', 'Week']),
  administrationTypes: toOptionList(['Pre Dialysis', 'During Dialysis', 'Post Dialysis']),
  administeredBy: toOptionList(['Nurse', 'Doctor', 'Patient', 'Relative']),
  indefiniteDurations: ['Until cancelled / chronic', 'Until next visit', 'As directed by physician'],
}

// ─── Type-conditional fields (§5) ───────────────────────────────────────────

/** Refills is Home-only; the two dialysis fields are Dialysis-only. */
export function isFieldVisibleForType(field: string, type: MedicationType): boolean {
  if (field === 'refills') return type === 'home_medications'
  if (field === 'administration_type' || field === 'duration_period') {
    return type === 'dialysis_medications'
  }
  return true
}

// ─── End-date preview (§6) ──────────────────────────────────────────────────

const SINGLE_DOSE = 'single dose'

/** `YYYY-MM-DD` for a date in the device's own calendar (never UTC-shifted). */
export function todayIso(from: Date = new Date()): string {
  const local = new Date(from.getTime() - from.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string | null {
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return null
  d.setDate(d.getDate() + days)
  return todayIso(d)
}

/**
 * Mirror of the server's end-date rule, for instant feedback only.
 * `null` means "no end date" — an ongoing course.
 */
export function computeEndDate(
  startDate: string,
  duration: string,
  indefiniteDurations: string[] = [],
): string | null {
  const start = (startDate ?? '').slice(0, 10)
  if (!start) return null
  const dur = (duration ?? '').trim()
  if (!dur) return start
  if (dur.toLowerCase() === SINGLE_DOSE) return start
  if (indefiniteDurations.some((d) => d.trim().toLowerCase() === dur.toLowerCase())) return null
  const digits = dur.match(/\d+/)
  const days = digits ? Number(digits[0]) : 0
  if (!days || days <= 0) return null
  return addDays(start, days)
}

// ─── Form rows ──────────────────────────────────────────────────────────────

export interface MedicationRowValues {
  drugId: number | null
  /** Display text for the chosen drug — never sent to the API. */
  drugLabel: string
  form: string
  dosage: string
  frequency: string
  route: string
  duration: string
  durationPeriod: string
  administrationType: string
  administeredBy: string
  quantity: string
  refills: string
  instructions: string
  startDate: string
}

export function emptyMedicationRow(): MedicationRowValues {
  return {
    drugId: null,
    drugLabel: '',
    form: '',
    dosage: '',
    frequency: '',
    route: '',
    duration: '',
    durationPeriod: '',
    administrationType: '',
    administeredBy: '',
    quantity: '',
    refills: '',
    instructions: '',
    startDate: todayIso(),
  }
}

export function medicationToRowValues(med: PatientMedication): MedicationRowValues {
  return {
    drugId: med.drugId,
    drugLabel: drugLabel(med.drug),
    form: med.form,
    dosage: med.dosage,
    frequency: med.frequency,
    route: med.route,
    duration: med.duration,
    durationPeriod: med.durationPeriod,
    administrationType: med.administrationType,
    administeredBy: med.administeredBy,
    quantity: med.quantity,
    refills: med.refills != null ? String(med.refills) : '',
    instructions: med.instructions,
    startDate: med.startDate ?? todayIso(),
  }
}

/** Local guard before the request — the server validates again regardless. */
export function validateMedicationRow(row: MedicationRowValues): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!row.drugId) errors.drug_id = 'Required'
  if (!row.form.trim()) errors.form = 'Required'
  if (!row.dosage.trim()) errors.dosage = 'Required'
  else if (row.dosage.length > 255) errors.dosage = 'Too long (max 255)'
  if (!row.frequency.trim()) errors.frequency = 'Required'
  else if (row.frequency.length > 255) errors.frequency = 'Too long (max 255)'
  if (!row.startDate) errors.start_date = 'Required'
  if (row.refills.trim()) {
    const n = Number(row.refills)
    if (!Number.isInteger(n) || n < 0 || n > 99) errors.refills = 'Whole number, 0–99'
  }
  if (row.instructions.length > 1000) errors.instructions = 'Too long (max 1000)'
  return errors
}

/** Save stays disabled until at least one row has picked a drug. */
export function rowHasDrug(row: MedicationRowValues): boolean {
  return !!row.drugId
}

// ─── Serialization ──────────────────────────────────────────────────────────

/**
 * One row's payload. `end_date` is deliberately absent — §12.1: the server
 * computes it and ignores anything sent.
 */
export function buildMedicationRowBody(
  row: MedicationRowValues,
  type: MedicationType,
  visitId?: number | null,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    drug_id: row.drugId,
    form: row.form.trim(),
    dosage: row.dosage.trim(),
    frequency: row.frequency.trim(),
    start_date: row.startDate,
  }
  const put = (key: string, value: string) => {
    const v = (value ?? '').trim()
    if (v) body[key] = v
  }
  put('route', row.route)
  put('duration', row.duration)
  put('quantity', row.quantity)
  put('administered_by', row.administeredBy)
  put('instructions', row.instructions)

  if (isFieldVisibleForType('refills', type) && row.refills.trim()) {
    body.refills = Number(row.refills)
  }
  if (isFieldVisibleForType('duration_period', type)) put('duration_period', row.durationPeriod)
  if (isFieldVisibleForType('administration_type', type)) put('administration_type', row.administrationType)
  if (visitId) body.visit_id = visitId

  return body
}

/** `POST /patients/{p}/medications` — `type` sits outside the array (§4). */
export function buildCreateMedicationsBody(
  rows: MedicationRowValues[],
  type: MedicationType,
  visitId?: number | null,
): Record<string, unknown> {
  return {
    type,
    medications: rows.map((row) => buildMedicationRowBody(row, type, visitId)),
  }
}

/** `PUT /patients/{p}/medications/{id}` — the same fields, flat, without `type`. */
export function buildUpdateMedicationBody(
  row: MedicationRowValues,
  type: MedicationType,
  visitId?: number | null,
): Record<string, unknown> {
  return buildMedicationRowBody(row, type, visitId)
}

// ─── Server validation errors ───────────────────────────────────────────────

export interface MedicationValidationErrors {
  /** Row index → field → first message, from `medications.{i}.{field}`. */
  rows: Record<number, Record<string, string>>
  /** Anything without a row index (the flat edit body, or top-level keys). */
  flat: Record<string, string>
  message: string
}

/**
 * Unpack a 422 body. Bulk saves key their errors `medications.{index}.{field}`
 * so every message can be routed back to the row that caused it.
 */
export function parseMedicationErrors(err: any): MedicationValidationErrors {
  const data = err?.response?.data
  // `api_client` normalises axios failures into an Error that keeps both the
  // raw response and a `fieldErrors` copy — read whichever survived.
  const raw = data?.errors ?? err?.fieldErrors ?? {}
  const out: MedicationValidationErrors = { rows: {}, flat: {}, message: data?.message ?? '' }
  for (const [key, value] of Object.entries<any>(raw)) {
    const message = Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
    const match = key.match(/^medications\.(\d+)\.(.+)$/)
    if (match) {
      const index = Number(match[1])
      out.rows[index] = { ...(out.rows[index] ?? {}), [match[2]]: message }
    } else {
      out.flat[key.replace(/^medications\./, '')] = message
    }
  }
  return out
}

/** `true` when a request failed validation rather than something else. */
export function isValidationError(err: any): boolean {
  return err?.status === 422 || err?.response?.status === 422
}
