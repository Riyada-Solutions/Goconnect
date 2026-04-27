import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetDashboardStats } from './mock/home_mock'
import type { DashboardStats } from './models/home'

export async function getDashboardStats(): Promise<DashboardStats> {
  if (ENV.USE_MOCK_DATA) return mockGetDashboardStats()
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats')
  return data
}
