import type { HomeData } from '../models/home'
import { MOCK_PATIENTS } from './patients_mock'
import { mockGetVisits } from './visits_mock'

export async function mockGetHomeData(): Promise<HomeData> {
  const visits = await mockGetVisits()
  return {
    stats: {
      totalPatients: 127,
      todayVisits: 8,
      pendingSchedules: 5,
      completedVisits: 3,
    },
    todayVisits: visits.slice(0, 3),
    recentPatients: MOCK_PATIENTS.slice(0, 4),
  }
}
