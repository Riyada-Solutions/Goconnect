import { getLabResultsByPatient } from '../data/labResult_repository'
import { useOfflineQuery } from './useOfflineQuery'

export function useLabResults(patientId: number) {
  return useOfflineQuery({
    queryKey: ['lab-results', patientId],
    queryFn: () => getLabResultsByPatient(patientId),
    enabled: !!patientId,
    cacheTtl: 5 * 60 * 1000, // 5 minutes — align with other patient-scoped queries
  })
}
