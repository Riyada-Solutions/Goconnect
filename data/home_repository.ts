import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetHomeData } from './mock/home_mock'
import type { HomeData } from './models/home'

/**
 * Fetch the full home-screen payload (stats + today's visits + recent
 * patients) in a single request.
 */
export async function getHomeData(): Promise<HomeData> {
  if (ENV.USE_MOCK_DATA) return mockGetHomeData()
  const { data } = await apiClient.get<HomeData>('/home')
  return data
}
