import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetHomeData } from './mock/home_mock'
import type { DashboardStats, HomeData } from './models/home'
import type { Patient } from './models/patient'
import type { Visit } from './models/visit'

const unwrap = <T>(raw: any): T => raw?.data ?? raw

/**
 * Build the home-screen payload from the real backend. There is no longer a
 * `/home` rollup endpoint, so we fan out into `/dashboard/stats`, `/visits`,
 * and `/patients` and stitch the results together client-side. Today's
 * visits = visits whose `date` matches the device's local date; recent
 * patients = first slice of the patients list (already sorted by id desc).
 */
export async function getHomeData(): Promise<HomeData> {
  if (ENV.USE_MOCK_DATA) return mockGetHomeData()

  const [statsRes, visitsRes, patientsRes] = await Promise.all([
    apiClient.get('/dashboard/stats'),
    apiClient.get('/visits'),
    apiClient.get('/patients'),
  ])

  const stats = unwrap<DashboardStats>(statsRes.data)
  const visits = unwrap<Visit[]>(visitsRes.data) ?? []
  const patients = unwrap<Patient[]>(patientsRes.data) ?? []

  const today = new Date().toISOString().slice(0, 10)
  const todayVisits = visits.filter((v) => v.date === today)
  const recentPatients = patients.slice(0, 10)

  return { stats, todayVisits, recentPatients }
}
