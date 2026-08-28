import { apiClient } from './api_client'
import { offlineMutate, offlinePost } from './offline_api'
import {
  mapDialysisOrderFromApi,
  normalizeDialysisOrderOptions,
  type DialysisOrder,
  type DialysisOrderOptions,
} from './models/dialysisOrder'
import { FALLBACK_DIALYSIS_ORDER_OPTIONS } from './models/dialysisOrderOptionsFallback'
import { EMPTY_META, parsePage } from './models/pagination'
import type { Page } from './models/pagination'

export const DIALYSIS_ORDERS_PER_PAGE = 10

export { FALLBACK_DIALYSIS_ORDER_OPTIONS }

/**
 * `GET /dialysis-orders/options` — the option lists and the 24 rules.
 * Called once per screen open and cached; ~16 KB.
 */
export async function getDialysisOrderOptions(): Promise<DialysisOrderOptions> {
  const res = await apiClient.get('/dialysis-orders/options')
  const raw = res.data?.data ?? res.data
  if (!raw) return FALLBACK_DIALYSIS_ORDER_OPTIONS
  // The payload is not shape-stable (lists arrive as arrays or as key→label
  // maps), so it is normalised here — the rule engine sees arrays only.
  const opts = normalizeDialysisOrderOptions(raw)
  if (Object.keys(opts.field_sets).length === 0) {
    opts.field_sets = FALLBACK_DIALYSIS_ORDER_OPTIONS.field_sets
  }
  return opts
}

/** `GET /patients/{p}/dialysis-orders` — newest first; the latest one is in force. */
export async function getDialysisOrdersPage(
  patientId: number | string,
  page = 1,
  perPage = DIALYSIS_ORDERS_PER_PAGE,
): Promise<Page<DialysisOrder>> {
  if (!patientId) return { items: [], meta: EMPTY_META, hasMore: false }
  const res = await apiClient.get(`/patients/${patientId}/dialysis-orders`, {
    params: { page, per_page: perPage },
  })
  const mapped = {
    ...res.data,
    data: (res.data?.data ?? []).map(mapDialysisOrderFromApi),
  }
  return parsePage<DialysisOrder>(mapped, page, perPage)
}

/** `GET /patients/{p}/dialysis-orders/{id}` — full order incl. `visibility`. */
export async function getDialysisOrder(
  patientId: number | string,
  orderId: number | string,
): Promise<DialysisOrder> {
  const res = await apiClient.get(`/patients/${patientId}/dialysis-orders/${orderId}`)
  return mapDialysisOrderFromApi(res.data?.data ?? res.data)
}

/**
 * The write endpoints all go through the offline wrappers, so a save made
 * without a connection is queued to SQLite and replayed by `SyncService` —
 * identical to every other visit form.
 */
export async function createDialysisOrder(
  patientId: number | string,
  body: Record<string, unknown>,
  visitId?: number | string,
): Promise<DialysisOrder> {
  const res = await offlinePost(`/patients/${patientId}/dialysis-orders`, body, visitId != null ? String(visitId) : undefined)
  return mapDialysisOrderFromApi(res.data?.data ?? res.data)
}

/** `changed: false` means the server wrote nothing and the acknowledgement stands. */
export async function updateDialysisOrder(
  patientId: number | string,
  orderId: number | string,
  body: Record<string, unknown>,
  visitId?: number | string,
): Promise<{ order: DialysisOrder; changed: boolean }> {
  const res = await offlineMutate('PUT', `/patients/${patientId}/dialysis-orders/${orderId}`, body, visitId != null ? String(visitId) : undefined)
  return {
    order: mapDialysisOrderFromApi(res.data?.data ?? res.data),
    changed: res.data?.changed !== false,
  }
}

/** Creates a new order from the shown values; the original keeps its acknowledgement. */
export async function duplicateDialysisOrder(
  patientId: number | string,
  orderId: number | string,
  body: Record<string, unknown>,
  visitId?: number | string,
): Promise<DialysisOrder> {
  const res = await offlinePost(`/patients/${patientId}/dialysis-orders/${orderId}/duplicate`, body, visitId != null ? String(visitId) : undefined)
  return mapDialysisOrderFromApi(res.data?.data ?? res.data)
}

/** Soft delete. The API rejects an acknowledged order with 400 — check `can_delete` first. */
export async function deleteDialysisOrder(
  patientId: number | string,
  orderId: number | string,
  visitId?: number | string,
): Promise<void> {
  await offlineMutate('DELETE', `/patients/${patientId}/dialysis-orders/${orderId}`, {}, visitId != null ? String(visitId) : undefined)
}

export async function acknowledgeDialysisOrder(
  patientId: number | string,
  orderId: number | string,
  visitId?: number | string,
): Promise<DialysisOrder> {
  const res = await offlinePost(`/patients/${patientId}/dialysis-orders/${orderId}/acknowledge`, {}, visitId != null ? String(visitId) : undefined)
  return mapDialysisOrderFromApi(res.data?.data ?? res.data)
}
