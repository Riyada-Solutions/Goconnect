import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mapInventoryItemFromApi } from './visit_repository'
import type { InventoryItem } from './models/visit'
import { parsePage, EMPTY_META } from './models/pagination'
import type { Page } from './models/pagination'

export const INVENTORY_PER_PAGE = 20

/** GET /patient-inventory?patient_id=&visit_id=&search=&page= */
export async function getInventoryPage(
  patientId: number | string,
  visitId: number | string,
  page = 1,
  search?: string,
): Promise<Page<InventoryItem>> {
  const q = search?.trim()
  if (ENV.USE_MOCK_DATA) {
    return { items: [], meta: { ...EMPTY_META, current_page: page }, hasMore: false }
  }
  const params: Record<string, unknown> = {
    patient_id: patientId,
    visit_id: visitId,
    page,
  }
  if (q) params.search = q
  const res = await apiClient.get('/patient-inventory', { params })
  const mapped = {
    ...res.data,
    data: (res.data?.data ?? res.data ?? []).map(mapInventoryItemFromApi),
  }
  return parsePage<InventoryItem>(mapped, page, INVENTORY_PER_PAGE)
}
