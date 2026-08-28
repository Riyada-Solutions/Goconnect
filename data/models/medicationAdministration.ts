/**
 * Medication Administration Record (MAR).
 *
 * Read-only compliance report: one row per active dialysis medication, one
 * cell per day in the selected range. Nothing on this screen writes — the
 * dose itself is recorded from the Flow Sheet during the visit, so an
 * offline session simply serves the last cached range with no conflict risk.
 */

export type MarStatus = 'none' | 'missed' | 'administered' | 'not_administered'
export type MarTone = 'muted' | 'warning' | 'success'

export interface MarDayCell {
  status: MarStatus
  label: string
  tone: MarTone
  dosage: string | null
  route: string | null
  visitId: number | null
  /** ISO8601 — convert to local time before display. */
  givenAt: string | null
  administeredBy: string | null
  /** Free text written by the nurse; render verbatim, any language. */
  reason: string | null
}

export interface MarSummary {
  administered: number
  notAdministered: number
  missed: number
  scheduled: number
}

export interface MarMedication {
  id: number
  drugId: number | null
  drugName: string
  drugCode: string | null
  scientificName: string | null
  form: string | null
  dosage: string | null
  route: string | null
  frequency: string | null
  startDate: string | null
  endDate: string | null
  summary: MarSummary
  /** date (YYYY-MM-DD) → cell. Every day in `days` is guaranteed present. */
  days: Record<string, MarDayCell>
}

export interface MarLegendItem {
  status: MarStatus
  label: string
  tone: MarTone
}

export interface MedicationAdministrationRecord {
  /** The range the **server** actually applied — show this, not what you asked for. */
  range: { startDate: string; endDate: string; days: number }
  /** Column order. Render the days in exactly this sequence. */
  days: string[]
  medications: MarMedication[]
  legend: MarLegendItem[]
  limits: { defaultDays: number; maxDays: number }
}

const asString = (v: unknown): string | null => (v == null || v === '' ? null : String(v))

function mapCell(raw: any): MarDayCell {
  const by = raw?.administered_by
  return {
    status: (raw?.status ?? 'none') as MarStatus,
    label: raw?.label ?? '—',
    tone: (raw?.tone ?? 'muted') as MarTone,
    dosage: asString(raw?.dosage),
    route: asString(raw?.route),
    visitId: raw?.visit_id != null ? Number(raw.visit_id) : null,
    givenAt: asString(raw?.given_at),
    administeredBy: by && typeof by === 'object' ? asString(by.name) : asString(by),
    reason: asString(raw?.reason),
  }
}

function mapMedication(raw: any): MarMedication {
  const days: Record<string, MarDayCell> = {}
  for (const [date, cell] of Object.entries(raw?.days ?? {})) days[date] = mapCell(cell)
  const s = raw?.summary ?? {}
  return {
    id: Number(raw?.id),
    drugId: raw?.drug_id != null ? Number(raw.drug_id) : null,
    drugName: raw?.drug_name ?? '—',
    drugCode: asString(raw?.drug_code),
    scientificName: asString(raw?.scientific_name),
    form: asString(raw?.form),
    dosage: asString(raw?.dosage),
    route: asString(raw?.route),
    frequency: asString(raw?.frequency),
    startDate: asString(raw?.start_date),
    endDate: asString(raw?.end_date),
    summary: {
      administered: Number(s.administered ?? 0),
      notAdministered: Number(s.not_administered ?? 0),
      missed: Number(s.missed ?? 0),
      scheduled: Number(s.scheduled ?? 0),
    },
    days,
  }
}

export function mapMedicationAdministrationFromApi(raw: any): MedicationAdministrationRecord {
  const range = raw?.range ?? {}
  const limits = raw?.limits ?? {}
  return {
    range: {
      startDate: range.start_date ?? '',
      endDate: range.end_date ?? '',
      days: Number(range.days ?? 0),
    },
    days: Array.isArray(raw?.days) ? raw.days : [],
    medications: (raw?.medications ?? []).map(mapMedication),
    legend: (raw?.legend ?? []).map((l: any) => ({
      status: l?.status as MarStatus,
      label: l?.label ?? '',
      tone: (l?.tone ?? 'muted') as MarTone,
    })),
    limits: {
      defaultDays: Number(limits.default_days ?? 7),
      maxDays: Number(limits.max_days ?? 92),
    },
  }
}

/** Palette for a cell tone, mapped onto the app's status colours. */
export const MAR_TONE_COLORS: Record<MarTone, string> = {
  success: '#10B981',
  warning: '#F59E0B',
  muted: '#9CA3AF',
}

/** `missed` must read differently from `not_administered` — one is a charting
 *  lapse, the other a recorded clinical decision. Same tone, different mark. */
export const MAR_STATUS_ICON: Record<MarStatus, string> = {
  administered: 'check-circle',
  not_administered: 'alert-triangle',
  missed: 'circle',
  none: 'minus',
}
