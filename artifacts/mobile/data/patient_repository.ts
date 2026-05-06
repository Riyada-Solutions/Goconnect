import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetPatients, mockGetPatientById } from './mock/patients_mock'
import type { Patient, PatientAlert, PatientAlertSummary } from './models/patient'
import { parsePage, EMPTY_META } from './models/pagination'
import type { Page } from './models/pagination'

export const PATIENTS_PER_PAGE = 20

export async function getPatientsPage(
  perPage = PATIENTS_PER_PAGE,
  page = 1,
): Promise<Page<Patient>> {
  if (ENV.USE_MOCK_DATA) {
    const items = await mockGetPatients()
    return { items, meta: { ...EMPTY_META, current_page: page, per_page: perPage, total: items.length }, hasMore: false }
  }
  const res = await apiClient.get('/patients', { params: { per_page: perPage, page } })
  return parsePage<Patient>(res.data, page, perPage)
}

export async function getPatientById(
  id: number | string,
): Promise<Patient | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetPatientById(Number(id))
  const res = await apiClient.get(`/patients/${id}`)
  return res.data?.data ?? res.data
}

/**
 * v2 contract: `GET /patients/{id}/alerts` returns the **summary object**
 * `{ allergies, contamination, instructions, isolation }`. Use
 * `getPatientAlertSummary` for the new shape.
 *
 * @deprecated The legacy "activity log" array shape is no longer served; this
 * helper now always returns `[]`. New code should call
 * `getPatientAlertSummary` instead.
 */
export async function getPatientAlerts(
  _id: number | string,
): Promise<PatientAlert[]> {
  return []
}

export async function getPatientAlertSummary(
  id: number | string,
): Promise<PatientAlertSummary | undefined> {
  if (ENV.USE_MOCK_DATA) return undefined
  const res = await apiClient.get(`/patients/${id}/alerts`)
  const payload = res.data?.data ?? res.data
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined
  return payload as PatientAlertSummary
}
