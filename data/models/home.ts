import type { Patient } from './patient'
import type { Slot } from './scheduler'
import type { Visit } from './visit'

/**
 * KPI cards on the home screen. Returned by `GET /dashboard`.
 * Legacy aliases are kept optional so any unmigrated reader still compiles.
 */
export interface DashboardStats {
  totalActivePatients?: number
  todayVisits?: number
  inProgressVisits?: number
  completedVisits?: number
  todayAppointments?: number
  confirmedAppointments?: number

  /** @deprecated use `totalActivePatients`. */
  totalPatients?: number
  /** @deprecated use `todayAppointments` or `confirmedAppointments`. */
  pendingSchedules?: number
}

/**
 * Single payload powering the home screen — KPI stats, today's visits, today's
 * appointments and notification count all ride on one response so the home
 * screen makes exactly one request on mount.
 *
 * `recentPatients` is no longer returned by the backend; kept on the model as
 * an empty array for any UI that still reads it.
 */
export interface HomeData {
  stats: DashboardStats
  todayVisits: Visit[]
  appointments: Slot[]
  notificationCount: number
  recentPatients: Patient[]
}
