import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetHomeData } from './mock/home_mock'
import type { DashboardStats, HomeData } from './models/home'
import type { Slot } from './models/scheduler'
import type { Visit } from './models/visit'

interface DashboardResponse {
  stats: DashboardStats
  visits: Visit[]
  appointments: Slot[]
  notification_count: number
}

/**
 * Build the home-screen payload. The backend now exposes a single
 * `GET /dashboard` rollup that returns stats, today's visits, today's
 * appointments and the unread-notification count in one shot.
 */
export async function getHomeData(): Promise<HomeData> {
  if (ENV.USE_MOCK_DATA) return mockGetHomeData()

  const res = await apiClient.get('/dashboard')
  const payload = (res.data?.data ?? res.data ?? {}) as Partial<DashboardResponse>

  return {
    stats: payload.stats ?? {},
    todayVisits: payload.visits ?? [],
    appointments: payload.appointments ?? [],
    notificationCount: payload.notification_count ?? 0,
    recentPatients: [],
  }
}
