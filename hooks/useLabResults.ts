import { useQuery } from '@tanstack/react-query'

import { getLabResultsByPatient } from '../data/labResult_repository'

export function useLabResults(patientId: number) {
  return useQuery({
    queryKey: ['lab-results', patientId],
    queryFn: () => getLabResultsByPatient(patientId),
    enabled: !!patientId,
    staleTime: 30_000,
  })
}
