import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  acknowledgeLabResult,
  getLabResultsByPatient,
} from '../data/labResult_repository'

export function useLabResults(patientId: number) {
  return useQuery({
    queryKey: ['lab-results', patientId],
    queryFn: () => getLabResultsByPatient(patientId),
    enabled: !!patientId,
    staleTime: 30_000,
  })
}

export function useAcknowledgeLabResult(patientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => acknowledgeLabResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results', patientId] })
    },
  })
}
