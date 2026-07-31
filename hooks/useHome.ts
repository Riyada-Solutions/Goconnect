import { getHomeData } from '../data/home_repository'
import { useOfflineQuery } from './useOfflineQuery'

/**
 * Single home-screen query — backed by `GET /home` which returns stats,
 * today's visits and the recent-patients carousel in one payload.
 */
export function useHome() {
  return useOfflineQuery({
    queryKey: ['home'],
    queryFn: getHomeData,
    cacheTtl: 60_000,
  })
}
