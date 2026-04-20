import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../data/home_repository'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 60_000,
  })
}
