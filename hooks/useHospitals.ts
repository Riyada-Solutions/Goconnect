import { useQuery } from '@tanstack/react-query'

import { getHospitals } from '@/data/hospitals_repository'
import type { Hospital } from '@/data/hospitals_repository'

export const HOSPITALS_QUERY_KEY = ['settings', 'hospitals'] as const

/**
 * Fetches and caches the hospital catalog used by the Referral form.
 * The list changes rarely so results are kept fresh for 30 minutes.
 */
export function useHospitals() {
  return useQuery({
    queryKey: HOSPITALS_QUERY_KEY,
    queryFn: getHospitals,
    staleTime: 30 * 60_000,
  })
}

export type { Hospital }
