import { getLabResultsByPatient } from '../data/labResult_repository'
import { useOfflineQuery } from './useOfflineQuery'

export function useLabResults(patientId: number) {
  return useOfflineQuery({
    queryKey: ['lab-results', patientId],
    queryFn: () => getLabResultsByPatient(patientId),
    enabled: !!patientId,
    cacheTtl: 30_000,
  })
}
