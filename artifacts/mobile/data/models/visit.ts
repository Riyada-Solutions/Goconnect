import type { CareTeamMember } from './careTeam'
import type { DoctorProgressNote } from './doctorProgressNote'
import type { FlowSheet } from './flowSheet'
import type { NursingProgressNote } from './nursingProgressNote'
import type { Patient, PatientAlert, PatientAlertSummary } from './patient'
import type { Referral } from './referral'
import type { Refusal } from './refusal'
import type { SariScreening } from './sariScreening'
import type { SocialWorkerProgressNote } from './socialWorkerProgressNote'

/**
 * All progress notes on this visit, grouped by author role. The mobile UI
 * renders three separate lists (`Nursing`, `Doctor`, `Social Worker`) — one
 * wrapper keeps the visit response flat and predictable.
 */
export interface ProgressNotes {
  nursing: NursingProgressNote[]
  doctor: DoctorProgressNote[]
  socialWorker: SocialWorkerProgressNote[]
}

/**
 * Raw shape of one row in the `forms` map returned by `GET /visits/{id}`.
 * Each form has a JSON `value` (form-specific), audit metadata, and the
 * actor who created/updated it.
 */
export interface VisitFormEntry<TValue = Record<string, unknown>> {
  id: number
  value: TValue
  createdAt: string
  updatedAt: string
  createdBy: { id: number; name: string }
  updatedBy: { id: number; name: string }
}

/**
 * Map of form-name → entries. The backend uses `[]` when no forms exist yet;
 * call sites should treat both an empty array and a missing key as "no
 * entries for this form".
 */
export type VisitForms =
  | Record<string, VisitFormEntry[]>
  | unknown[]

export interface Visit {
  id: string | number
  patientName: string
  patientId: string | number
  patientMrn?: string
  date: string
  time: string
  type: string
  status:
    | 'completed'
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'canceled'
    | 'in_progress'
    | 'start_procedure'
    | 'end_procedure'
    | 'reopened'
    | 'waiting'
    | 'new'
  provider?: string
  address?: string
  duration: number
  careTeam?: CareTeamMember[]

  /** Wall-clock timestamps from the API. */
  startTime?: string | null
  endTime?: string | null
  startProcedureTime?: string | null
  endProcedureTime?: string | null

  /** Raw form payloads as returned by the backend. May be `[]` when empty. */
  forms?: VisitForms

  /** Embedded patient record. The visit detail screen renders the patient hero
   *  card directly from this — no second `/patients/{id}` round-trip. */
  patient?: Patient | null
  /** Embedded patient alert summary (allergies, isolation, contamination,
   *  special instructions). Drives the "alerts" card on the visit screen.
   *  `null` when the patient has no alerts on file.
   *
   *  v2 contract: this is the summary **object** shape. The legacy
   *  array/single-event shapes are kept in the union only for the mock
   *  fixtures that still emit them. */
  patientAlerts?: PatientAlertSummary | PatientAlert[] | PatientAlert | null

  /** Full flow sheet snapshot (vitals, pain, fall risk, dialysis params, post-tx,
   *  signatures, **and pre-treatment vitals**). Grows incrementally as the nurse
   *  saves sections. */
  flowSheet?: FlowSheet

  /** All progress notes for this visit, grouped by author role. */
  progressNotes?: ProgressNotes

  referrals?: Referral[]
  refusals?: Refusal[]
  sariScreenings?: SariScreening[]

  /** Medications prescribed for this visit. The nurse marks each yes/no on the
   *  Dialysis Medications form; selections are submitted via §9.1.14. */
  medications?: DialysisMedication[]
  /** Patient inventory available during this visit. Consumption is recorded
   *  via §9.8. */
  inventory?: InventoryItem[]
}

export interface DialysisMedication {
  id: number
  drugName: string
  form: string
  dosage: string
  frequency: string
  route: string
  duration: string
  durationPeriod: string
  adminType: string
  instructions: string
}

export interface InventoryItem {
  id: number
  name: string
  itemNumber: string
  available: number
}

/** Body for `POST /visits/{visitId}/inventory-usage`. */
export interface InventoryUsageInput {
  visitId: number
  itemId: number
  /** Number of items consumed during this visit. Must be > 0 and ≤ available stock. */
  quantity: number
  notes?: string
}
