import { useQuery } from '@tanstack/react-query'

import { getRules } from '@/data/rules_repository'
import type { RuleAction } from '@/data/models/rules'

export const RULES_QUERY_KEY = ['rules'] as const

/**
 * Fetches and caches the user's action-level permissions.
 * Use the `can(action)` helper from `useApp()` for cheap synchronous checks
 * inside render — this hook is only needed if a screen wants to subscribe
 * directly to loading/error state of the rules call.
 */
export function useRules() {
  return useQuery({
    queryKey: RULES_QUERY_KEY,
    queryFn: getRules,
    staleTime: 5 * 60_000, // 5 min — rules rarely change mid-session
  })
}

export type { RuleAction }
