import { useQuery } from '@tanstack/react-query'

import { getMachines } from '@/data/machines_repository'
import type { Machine } from '@/data/models/machine'

export const MACHINES_QUERY_KEY = ['settings', 'machines'] as const

/**
 * Fetches and caches the machines catalog used by the Flow Sheet selector.
 * The catalog changes rarely, so we keep results fresh for 10 minutes.
 */
export function useMachines() {
  return useQuery({
    queryKey: MACHINES_QUERY_KEY,
    queryFn: getMachines,
    staleTime: 10 * 60_000,
  })
}

export type { Machine }
