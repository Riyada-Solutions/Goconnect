import type { DashboardStats } from '../../types/home'

export async function mockGetDashboardStats(): Promise<DashboardStats> {
  return {
    totalPatients: 127,
    todayVisits: 8,
    pendingSchedules: 5,
    completedVisits: 3,
  }
}
