import { useMutation, useQuery } from '@tanstack/react-query'

import {
  getWorkspace,
  setSelectedBranch,
  setSelectedSystem,
} from '@/data/settings_repository'

export const WORKSPACE_QUERY_KEY = ['workspace'] as const

/** Fetch the branches + systems the user can switch between. */
export function useWorkspace(enabled = true) {
  return useQuery({
    queryKey: WORKSPACE_QUERY_KEY,
    queryFn: getWorkspace,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

/** Persist the selected system ("center" | "home" | …). */
export function useSetSelectedSystem() {
  return useMutation({
    mutationFn: (system: string) => setSelectedSystem(system),
  })
}

/** Persist the selected branch by id. */
export function useSetSelectedBranch() {
  return useMutation({
    mutationFn: (branchId: number) => setSelectedBranch(branchId),
  })
}
