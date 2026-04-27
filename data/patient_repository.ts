import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetPatients, mockGetPatientById, mockGetPatientAlerts } from './mock/patients_mock'
import type { Patient, PatientAlert } from './models/patient'

export async function getPatients(): Promise<Patient[]> {
  if (ENV.USE_MOCK_DATA) return mockGetPatients()
  const { data } = await apiClient.get<Patient[]>('/patients')
  return data
}

export async function getPatientById(id: number): Promise<Patient | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetPatientById(id)
  const { data } = await apiClient.get<Patient>(`/patients/${id}`)
  return data
}

export async function getPatientAlerts(patientId: number): Promise<PatientAlert | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetPatientAlerts(patientId)
  const { data } = await apiClient.get<PatientAlert>(`/patients/${patientId}/alerts`)
  return data
}
