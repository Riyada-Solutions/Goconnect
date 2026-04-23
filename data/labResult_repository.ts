import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import {
  mockGetLabResultsByPatient,
  mockAcknowledgeLabResult,
} from './mock/labResults_mock'
import type { LabResult } from './models/labResult'

export async function getLabResultsByPatient(
  patientId: number,
): Promise<LabResult[]> {
  if (ENV.USE_MOCK_DATA) return mockGetLabResultsByPatient(patientId)
  const { data } = await apiClient.get<{ data: LabResult[] } | LabResult[]>(
    `/patients/${patientId}/lab-results`,
  )
  return Array.isArray(data) ? data : data.data
}

export async function acknowledgeLabResult(id: number): Promise<LabResult> {
  if (ENV.USE_MOCK_DATA) return mockAcknowledgeLabResult(id)
  const { data } = await apiClient.post<{ data: LabResult } | LabResult>(
    `/lab-results/${id}/acknowledge`,
  )
  return (data as any)?.data ?? (data as LabResult)
}
