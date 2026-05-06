import { useQuery } from '@tanstack/react-query'
import { getHomeData } from '../data/home_repository'

/**
 * Single home-screen query — backed by `GET /home` which returns stats,
 * today's visits and the recent-patients carousel in one payload.
 */
export function useHome() {
  return useQuery({
    queryKey: ['home'],
    queryFn: getHomeData,
    staleTime: 60_000,
  })
}
