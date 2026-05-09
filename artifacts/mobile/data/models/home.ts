import type { Patient } from './patient'
import type { Visit } from './visit'

/**
 * KPI cards on the home screen. Field names changed when the dashboard moved
 * from `/home` to `/dashboard/stats`; we accept both old and new names so
 * unmigrated screens can still read whatever is populated.
 */
export interface DashboardStats {
  /** New API. */
  totalActivePatients?: number
  inProgressVisits?: number
  todayAppointments?: number
  confirmedAppointments?: number

  /** Legacy mock fields. */
  totalPatients?: number
  pendingSchedules?: number

  /** Present in both. */
  todayVisits?: number
  completedVisits?: number
}

/**
 * Single payload powering the home screen — KPI stats, today's visits and the
 * recent-patients carousel all ride on one response so the home screen makes
 * exactly one request on mount.
 */
export interface HomeData {
  stats: DashboardStats
  todayVisits: Visit[]
  recentPatients: Patient[]
}
