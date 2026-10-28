import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { searchIcdCodes } from '@/data/visit_repository'
import { useDebounce } from './useDebounce'

/** Debounced ICD typeahead for the Patient Assessment (new) Final Diagnosis field. */
export function useIcdCodeSearch(search: string, enabled = true) {
  const term = useDebounce(search.trim(), 300)
  return useQuery({
    queryKey: ['icd-codes', 'search', term],
    queryFn: () => searchIcdCodes({ search: term, perPage: 30 }),
    enabled: enabled && term.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  })
}

/** Resolves saved ICD codes to their descriptions (retired codes included). */
export function useIcdCodeLabels(codes: string[]) {
  const sorted = [...codes].sort()
  return useQuery({
    queryKey: ['icd-codes', 'resolve', sorted],
    queryFn: () => searchIcdCodes({ codes: sorted, perPage: 50 }),
    enabled: sorted.length > 0,
    staleTime: 60 * 60 * 1000,
  })
}
