import { ENV } from '../constants/env'
import { DateTimeConverter } from '../utils/datetime'
import { apiClient } from './api_client'
import { mockGetHomeData } from './mock/home_mock'
import type { DashboardStats, HomeData } from './models/home'
import type { Slot } from './models/scheduler'
import type { Visit } from './models/visit'

interface DashboardResponse {
  stats: DashboardStats
  visits: any[]
  appointments: Slot[]
  notification_count: number
}

/**
 * `GET /dashboard`'s `visits` entries are full visit-detail objects (same
 * shape as `GET /visits/{id}`), not pre-formatted list rows — timestamps ride
 * as snake_case `start_time`/`end_time` and the patient's name/id live under
 * a nested `patient` object. Derive the flat fields the home cards read
 * (`time`, `endTime`, `patientName`, `patientId`) so they don't render blank.
 */
function mapDashboardVisit(raw: any): Visit {
  const patient = raw?.patient ?? {}
  return {
    ...raw,
    time:        DateTimeConverter.time(raw?.start_time ?? raw?.startTime) || String(raw?.time ?? ''),
    startTime:   raw?.start_time ?? raw?.startTime ?? null,
    endTime:     raw?.end_time ?? raw?.endTime ?? null,
    patientName: raw?.patientName ?? patient.name ?? '',
    patientId:   raw?.patientId ?? patient.id ?? raw?.id,
  }
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
    todayVisits: (payload.visits ?? []).map(mapDashboardVisit),
    appointments: payload.appointments ?? [],
    notificationCount: payload.notification_count ?? 0,
    recentPatients: [],
  }
}
