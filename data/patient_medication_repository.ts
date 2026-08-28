import { apiClient } from './api_client'
import {
  FALLBACK_MEDICATION_OPTIONS,
  mapDrugFromApi,
  mapMedicationFromApi,
  mapMedicationOptionsFromApi,
  mapRefillFromApi,
  type Drug,
  type MedicationOptions,
  type MedicationRefillEntry,
  type MedicationType,
  type PatientMedication,
} from './models/patientMedication'
import { offlineMutate, offlinePost } from './offline_api'
import { EMPTY_META, parsePage } from './models/pagination'
import type { Page } from './models/pagination'

export const MEDICATIONS_PER_PAGE = 15
export const DRUG_SEARCH_PER_PAGE = 20

export { FALLBACK_MEDICATION_OPTIONS }

/**
 * `GET /medications/options` — forms, routes, frequencies, durations.
 * Static data: fetched once and cached for a day.
 */
export async function getMedicationOptions(): Promise<MedicationOptions> {
  const res = await apiClient.get('/medications/options')
  const raw = res.data?.data ?? res.data
  if (!raw) return FALLBACK_MEDICATION_OPTIONS
  return mapMedicationOptionsFromApi(raw)
}

/** `GET /drugs?search=` — the add-form autocomplete. Debounce before calling. */
export async function searchDrugs(term: string, perPage = DRUG_SEARCH_PER_PAGE): Promise<Drug[]> {
  const res = await apiClient.get('/drugs', { params: { search: term, per_page: perPage } })
  const list = res.data?.data ?? res.data ?? []
  return (Array.isArray(list) ? list : []).map(mapDrugFromApi).filter(Boolean) as Drug[]
}

export interface MedicationListParams {
  type: MedicationType
  /** `true` = Active, `false` = Deactivated, omitted = both. */
  status?: boolean
  search?: string
  page?: number
  perPage?: number
}

/** `GET /patients/{p}/medications` — one page of one section. */
export async function getPatientMedicationsPage(
  patientId: number | string,
  { type, status, search, page = 1, perPage = MEDICATIONS_PER_PAGE }: MedicationListParams,
): Promise<Page<PatientMedication>> {
  if (!patientId) return { items: [], meta: EMPTY_META, hasMore: false }
  const params: Record<string, unknown> = { type, page, per_page: perPage }
  if (status !== undefined) params.status = status ? 1 : 0
  if (search) params.search = search
  const res = await apiClient.get(`/patients/${patientId}/medications`, { params })
  const mapped = {
    ...res.data,
    data: (res.data?.data ?? []).map(mapMedicationFromApi),
  }
  return parsePage<PatientMedication>(mapped, page, perPage)
}

/** `GET /patients/{p}/medications/{id}` — the detail sheet. */
export async function getPatientMedication(
  patientId: number | string,
  medicationId: number | string,
): Promise<PatientMedication> {
  const res = await apiClient.get(`/patients/${patientId}/medications/${medicationId}`)
  return mapMedicationFromApi(res.data?.data ?? res.data)
}

/** `GET /patients/{p}/medications/{id}/refills` — refill history, newest first. */
export async function getMedicationRefills(
  patientId: number | string,
  medicationId: number | string,
): Promise<MedicationRefillEntry[]> {
  const res = await apiClient.get(`/patients/${patientId}/medications/${medicationId}/refills`)
  const list = res.data?.data ?? res.data ?? []
  return (Array.isArray(list) ? list : []).map(mapRefillFromApi)
}

/**
 * Every write goes through the offline wrappers, so a save made without a
 * connection is queued to SQLite and replayed by `SyncService` — the same
 * path every other visit form uses.
 */

/** `POST /patients/{p}/medications` — atomic bulk create; returns every row. */
export async function createPatientMedications(
  patientId: number | string,
  body: Record<string, unknown>,
  visitId?: number | string,
): Promise<PatientMedication[]> {
  const res = await offlinePost(
    `/patients/${patientId}/medications`,
    body,
    visitId != null ? String(visitId) : undefined,
  )
  const list = res.data?.data ?? res.data ?? []
  return (Array.isArray(list) ? list : [list]).map(mapMedicationFromApi)
}

/** `PUT /patients/{p}/medications/{id}` — flat body; keeps the current status. */
export async function updatePatientMedication(
  patientId: number | string,
  medicationId: number | string,
  body: Record<string, unknown>,
  visitId?: number | string,
): Promise<PatientMedication> {
  const res = await offlineMutate(
    'PUT',
    `/patients/${patientId}/medications/${medicationId}`,
    body,
    visitId != null ? String(visitId) : undefined,
  )
  return mapMedicationFromApi(res.data?.data ?? res.data)
}

export async function deletePatientMedication(
  patientId: number | string,
  medicationId: number | string,
  visitId?: number | string,
): Promise<void> {
  await offlineMutate(
    'DELETE',
    `/patients/${patientId}/medications/${medicationId}`,
    {},
    visitId != null ? String(visitId) : undefined,
  )
}

/** Stop (`deactivate`) / resume (`reactivate`) — the row moves between sections. */
export async function setPatientMedicationStatus(
  patientId: number | string,
  medicationId: number | string,
  active: boolean,
  visitId?: number | string,
): Promise<PatientMedication> {
  const action = active ? 'reactivate' : 'deactivate'
  const res = await offlinePost(
    `/patients/${patientId}/medications/${medicationId}/${action}`,
    {},
    visitId != null ? String(visitId) : undefined,
  )
  return mapMedicationFromApi(res.data?.data ?? res.data)
}

/** `POST …/{id}/administer` — records a dose and refreshes `last_dose_at`. */
export async function administerPatientMedication(
  patientId: number | string,
  medicationId: number | string,
  body: { administered_by: string; reason?: string },
  visitId?: number | string,
): Promise<PatientMedication> {
  const res = await offlinePost(
    `/patients/${patientId}/medications/${medicationId}/administer`,
    body as Record<string, unknown>,
    visitId != null ? String(visitId) : undefined,
  )
  return mapMedicationFromApi(res.data?.data ?? res.data)
}

/**
 * `POST …/{id}/refill` — restarts the course from today.
 * Rejected with 400 when the medication is stopped, has no end date, or has
 * not expired yet; gate the button on `can_refill` instead of guessing.
 */
export async function refillPatientMedication(
  patientId: number | string,
  medicationId: number | string,
  notes?: string,
  visitId?: number | string,
): Promise<PatientMedication> {
  const res = await offlinePost(
    `/patients/${patientId}/medications/${medicationId}/refill`,
    notes ? { notes } : {},
    visitId != null ? String(visitId) : undefined,
  )
  return mapMedicationFromApi(res.data?.data ?? res.data)
}
