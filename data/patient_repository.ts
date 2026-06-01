import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetPatients, mockGetPatientById } from './mock/patients_mock'
import type { Patient, PatientAlert } from './models/patient'
import { parsePage, EMPTY_META } from './models/pagination'
import type { Page } from './models/pagination'

export const PATIENTS_PER_PAGE = 20

export async function getPatientsPage(
  perPage = PATIENTS_PER_PAGE,
  page = 1,
  search?: string,
): Promise<Page<Patient>> {
  const q = search?.trim()
  if (ENV.USE_MOCK_DATA) {
    let items = await mockGetPatients()
    if (q) {
      const needle = q.toLowerCase()
      items = items.filter((p) =>
        [p.name, p.patientId, p.mrn, p.phone, p.diagnosis, String(p.id)].some(
          (f) => f?.toLowerCase().includes(needle),
        ),
      )
    }
    return { items, meta: { ...EMPTY_META, current_page: page, per_page: perPage, total: items.length }, hasMore: false }
  }
  const params: Record<string, unknown> = { per_page: perPage, page }
  if (q) params.search = q
  const res = await apiClient.get('/patients', { params })
  return parsePage<Patient>(res.data, page, perPage)
}

export async function getPatientById(
  id: number | string,
): Promise<Patient | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetPatientById(Number(id))
  const res = await apiClient.get(`/patients/${id}`)
  return res.data?.data ?? res.data
}

export async function getPatientAlerts(
  id: number | string,
): Promise<PatientAlert[]> {
  if (ENV.USE_MOCK_DATA) return []
  const res = await apiClient.get(`/patients/${id}/alerts`)
  const payload = res.data?.data ?? res.data
  return Array.isArray(payload) ? (payload as PatientAlert[]) : []
}
