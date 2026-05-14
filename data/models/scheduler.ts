import type { CareTeamMember } from './careTeam'
import type { Patient } from './patient'

/**
 * Canonical appointment status values returned by the scheduler API.
 * Backend uses snake_case for `checked_in` and `no_show`.
 */
export const AppointmentStatus = {
  New: 'new',
  Pending: 'waiting',
  Confirmed: 'confirmed',
  CheckedIn: 'checked_in',
  Completed: 'completed',
  Canceled: 'canceled',
  NoShow: 'no_show',
} as const
export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.New,
  AppointmentStatus.Pending,
  AppointmentStatus.Confirmed,
  AppointmentStatus.CheckedIn,
  AppointmentStatus.Completed,
  AppointmentStatus.Canceled,
  AppointmentStatus.NoShow,
]

/**
 * Normalize loose backend variants (`checked-in`, `cancelled`, `noShow`, …)
 * onto the canonical enum. Returns `undefined` for unknown values so callers
 * can decide what to do (typically fall back to `pending`).
 */
export function normalizeAppointmentStatus(
  raw: string | null | undefined,
): AppointmentStatus | undefined {
  if (!raw) return undefined
  const key = raw.toLowerCase().replace(/-/g, '_')
  switch (key) {
    case 'new':            return AppointmentStatus.New
    case 'waiting':
    case 'pending':        return AppointmentStatus.Pending
    case 'confirmed':      return AppointmentStatus.Confirmed
    case 'checked_in':
    case 'checkedin':      return AppointmentStatus.CheckedIn
    case 'completed':      return AppointmentStatus.Completed
    case 'canceled':
    case 'cancelled':      return AppointmentStatus.Canceled
    case 'no_show':
    case 'noshow':         return AppointmentStatus.NoShow
    default:               return undefined
  }
}

/** i18n key for each canonical appointment status. */
export function appointmentStatusLabelKey(
  status: AppointmentStatus,
): 'newStatus' | 'pending' | 'confirmed' | 'checkedIn' | 'completed' | 'canceled' | 'noShow' {
  switch (status) {
    case AppointmentStatus.New:        return 'newStatus'
    case AppointmentStatus.Pending:    return 'pending'
    case AppointmentStatus.Confirmed:  return 'confirmed'
    case AppointmentStatus.CheckedIn:  return 'checkedIn'
    case AppointmentStatus.Completed:  return 'completed'
    case AppointmentStatus.Canceled:   return 'canceled'
    case AppointmentStatus.NoShow:     return 'noShow'
  }
}

/** Resolve a canonical status to its translated label. `t` is typed loosely
 *  so call sites can pass the strongly-typed `useApp().t` without a cast. */
export function appointmentStatusLabel(
  status: AppointmentStatus,
  t: (key: any) => string,
): string {
  return t(appointmentStatusLabelKey(status))
}

/**
 * Real API exposes a small core subset; the legacy mock fields (provider,
 * hospital, insurance, careTeam, etc.) are kept optional so existing screens
 * don't break while they get migrated off them.
 */
export interface Slot {
  id: string | number
  patientId?: string | number
  patientName?: string
  patientMrn?: string
  /** ISO date `YYYY-MM-DD`. */
  date?: string
  /** Start time `HH:mm`. */
  time: string
  /** End time `HH:mm`. */
  endTime: string
  /** Live status returned by the scheduler API. See `AppointmentStatus`.
   *  Typed as `string` to absorb backend variants — normalize with
   *  `normalizeAppointmentStatus()` before branching on it. */
  status: AppointmentStatus | string
  isConfirmed?: boolean
  instructions?: string
  nurseId?: string | number
  /** Set by the backend once the slot has been checked in and a visit has
   *  been spawned. `null`/missing while the slot is still pending. */
  visit_id?: number | string | null
  /** camelCase alias of `visit_id` — kept so either spelling round-trips. */
  visitId?: number | string | null

  // Legacy mock-only fields (still referenced by some screens) — all optional.
  phone?: string
  address?: string
  type?: string
  provider?: string
  visitDate?: string
  procedureTime?: string
  visitTime?: string
  hospital?: string
  insurance?: string
  doctorTime?: string
  careTeam?: CareTeamMember[]

  /** Embedded patient record so the appointment detail screen can render the
   *  patient hero card without a second `/patients/{id}` request. `null` for
   *  slots without a patient (e.g. provider breaks). */
  patient?: Patient | null
}
