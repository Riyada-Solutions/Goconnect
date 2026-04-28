import type { Patient } from './patient'
import type { Visit } from './visit'

export interface DashboardStats {
  totalPatients: number
  todayVisits: number
  pendingSchedules: number
  completedVisits: number
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
