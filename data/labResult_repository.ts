import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetLabResultsByPatient } from './mock/labResults_mock'
import type { LabResult } from './models/labResult'

export async function getLabResultsByPatient(
  patientId: number,
): Promise<LabResult[]> {
  if (ENV.USE_MOCK_DATA) return mockGetLabResultsByPatient(patientId)
  try {
    console.log('[getLabResultsByPatient] Fetching for patient:', patientId)
    const { data } = await apiClient.get<{ data: LabResult[] } | LabResult[]>(
      `/patients/${patientId}/lab-orders`,
    )
    const results = Array.isArray(data) ? data : data.data
    console.log('[getLabResultsByPatient] Success, received:', results.length, 'results')
    return results
  } catch (error) {
    console.error('[getLabResultsByPatient] Error:', {
      patientId,
      error: String(error),
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      statusText: (error as any)?.response?.statusText,
    })
    return []
  }
}
