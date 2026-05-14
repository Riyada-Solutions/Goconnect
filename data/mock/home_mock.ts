import type { HomeData } from '../models/home'
import { MOCK_PATIENTS } from './patients_mock'
import { mockGetVisits } from './visits_mock'

export async function mockGetHomeData(): Promise<HomeData> {
  const visits = await mockGetVisits()
  return {
    stats: {
      totalActivePatients: 127,
      todayVisits: 8,
      inProgressVisits: 2,
      completedVisits: 3,
      todayAppointments: 5,
      confirmedAppointments: 4,
    },
    todayVisits: visits.slice(0, 3),
    appointments: [],
    notificationCount: 0,
    recentPatients: MOCK_PATIENTS.slice(0, 4),
  }
}
