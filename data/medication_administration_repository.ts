import { apiClient } from './api_client'
import {
  mapMedicationAdministrationFromApi,
  type MedicationAdministrationRecord,
} from './models/medicationAdministration'

/** The server's own defaults, mirrored so the picker can seed a sane range. */
export const MAR_DEFAULT_DAYS = 7
export const MAR_MAX_DAYS = 92

/**
 * `GET /patients/{id}/medication-administration?start_date=&end_date=`
 *
 * Both params are optional: with neither, the server returns the last 7 days.
 * It also caps the range at 92 days and flips a reversed one — always render
 * `range` from the response rather than assuming the request went through
 * verbatim.
 */
export async function getMedicationAdministration(
  patientId: number | string,
  startDate?: string,
  endDate?: string,
): Promise<MedicationAdministrationRecord> {
  const params: Record<string, unknown> = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  const res = await apiClient.get(`/patients/${patientId}/medication-administration`, { params })
  return mapMedicationAdministrationFromApi(res.data?.data ?? res.data)
}

/** `YYYY-MM-DD` for a date `daysBack` days before `from` (default: today). */
export function marDateOffset(daysBack: number, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - daysBack)
  return d.toISOString().slice(0, 10)
}
