import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetLabResultsByPatient } from './mock/labResults_mock'
import type { LabResult } from './models/labResult'

export async function getLabResultsByPatient(
  patientId: number,
): Promise<LabResult[]> {
  if (ENV.USE_MOCK_DATA) return mockGetLabResultsByPatient(patientId)
  const { data } = await apiClient.get<{ data: LabResult[] } | LabResult[]>(
    `/patients/${patientId}/lab-orders`,
  )
  return Array.isArray(data) ? data : data.data
}
