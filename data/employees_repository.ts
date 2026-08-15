import { ENV } from '@/constants/env'
import { apiClient } from './api_client'
import { isEffectivelyOnline } from '@/context/NetworkContext'

export type EmployeeType = 'physician' | 'nurse' | 'social_worker'

export interface EmployeeOption {
  id: number
  /** Raw display text from the API, e.g. "hailah.alqahtani (Social Worker)". */
  text: string
  /** `text` with the trailing "(Role)" suffix stripped — what the save
   *  payload expects for `attending_physician` / `on_charge_nurse` /
   *  `social_worker`. */
  username: string
}

function parseEmployee(raw: any): EmployeeOption | null {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id)
  const text = String(raw.text ?? raw.name ?? '')
  if (!id || !text) return null
  const username = text.replace(/\s*\([^)]*\)\s*$/, '').trim() || text
  return { id, text, username }
}

/**
 * Searches physicians/nurses/social workers by name for the Patient
 * Responsibility sign-off pickers.
 *
 * `GET /employees/autocomplete?q=<query>&type=<physician|nurse|social_worker>`
 *
 * Not cached offline (search results churn per-keystroke, not worth persisting) —
 * just returns no matches instead of a raw network error when offline.
 */
export async function searchEmployees(type: EmployeeType, query: string): Promise<EmployeeOption[]> {
  if (ENV.USE_MOCK_DATA) return []
  if (!(await isEffectivelyOnline())) return []
  const res = await apiClient.get('/employees/autocomplete', { params: { q: query, type } })
  const body = res.data
  const items: any[] = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []
  return items.map(parseEmployee).filter((e): e is EmployeeOption => e !== null)
}
