import { ENV } from '../constants/env'
import { apiClient } from './api_client'

export interface Hospital {
  id: number
  name: string
}

function parseHospital(raw: any): Hospital | null {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id)
  const name = String(raw.name ?? raw.hospital_name ?? '')
  if (!id || !name) return null
  return { id, name }
}

/**
 * Fetch the hospital catalog from `GET /settings/hospitals`.
 * Tolerates both paginated `{ data: [] }` and plain array responses.
 */
export async function getHospitals(): Promise<Hospital[]> {
  if (ENV.USE_MOCK_DATA) return []

  const res = await apiClient.get('/settings/hospitals', {
    // params: { per_page: 100, page: 1 },
  })
  const body = res.data
  const items: any[] = Array.isArray(body?.data) ? body.data
    : Array.isArray(body) ? body
    : []

  return items.map(parseHospital).filter((h): h is Hospital => h !== null)
}
