import { useQuery } from '@tanstack/react-query'
import { getPatients, getPatientById, getPatientAlerts } from '../data/patient_repository'

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
    staleTime: 30_000,
  })
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => getPatientById(id),
    staleTime: 30_000,
    enabled: !!id,
  })
}

export function usePatientAlerts(patientId: number) {
  return useQuery({
    queryKey: ['patients', patientId, 'alerts'],
    queryFn: () => getPatientAlerts(patientId),
    staleTime: 30_000,
    enabled: !!patientId,
  })
}
