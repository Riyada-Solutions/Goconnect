import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetSlots, mockGetSlotById } from './mock/scheduler_mock'
import type { Slot } from './models/scheduler'

const unwrapSlot = (raw: any): Slot => raw?.data ?? raw
const unwrapSlots = (raw: any): Slot[] => raw?.data ?? raw ?? []

export interface SlotsQuery {
  date?: string   // YYYY-MM-DD
  perPage?: number
  page?: number
}

export async function getSlots(query?: SlotsQuery): Promise<Slot[]> {
  if (ENV.USE_MOCK_DATA) return mockGetSlots()
  const params: Record<string, unknown> = {}
  if (query?.date) params.date = query.date
  if (query?.perPage != null) params.per_page = query.perPage
  if (query?.page != null) params.page = query.page
  const res = await apiClient.get('/scheduler/slots', {
    params: Object.keys(params).length ? params : undefined,
  })
  return unwrapSlots(res.data)
}

export async function getSlotById(
  id: number | string,
): Promise<Slot | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetSlotById(Number(id))
  const res = await apiClient.get(`/scheduler/slots/${id}`)
  return unwrapSlot(res.data)
}

// ─── Status transitions ─────────────────────────────────────────────────────
//
// Each transition returns the updated Slot so the UI can refresh its cache.
// Mock mode patches the in-memory slot and resolves; real mode posts to the
// backend.

const unwrap = (raw: any): Slot => raw?.data ?? raw

async function patchMockSlot(id: number, status: string): Promise<Slot> {
  await new Promise((r) => setTimeout(r, 300))
  const current = await mockGetSlotById(id)
  if (!current) throw new Error('Slot not found')
  ;(current as any).status = status
  return current
}

/**
 * Status-transition POST endpoints (confirm / check-in / cancel) return the
 * same Slot shape as `GET /scheduler/slots/{id}` when they succeed. When the
 * response is missing, malformed, or doesn't include an `id`, we fall back to
 * a fresh GET so the caller always receives a fully-populated Slot.
 */
async function postSlotTransition(
  slotId: number | string,
  path: 'confirm' | 'check-in' | 'cancel',
  body?: unknown,
): Promise<Slot> {
  const res = await apiClient.post(
    `/scheduler/slots/${slotId}/${path}`,
    body,
    // Don't throw on non-2xx — we'll fall back to GET instead.
    { validateStatus: () => true },
  )
  const ok = res.status >= 200 && res.status < 300
  const candidate = ok ? unwrap(res.data) : undefined
  if (candidate && (candidate as any).id != null) return candidate

  const fallback = await getSlotById(slotId)
  if (!fallback) throw new Error('Slot not found after transition')
  return fallback
}

export async function confirmAppointment(
  slotId: number | string,
): Promise<Slot> {
  if (ENV.USE_MOCK_DATA) return patchMockSlot(Number(slotId), 'confirmed')
  return postSlotTransition(slotId, 'confirm')
}

export async function confirmAppointmentForNurse(
  slotId: number | string,
  nurseId: number | string,
): Promise<Slot> {
  if (ENV.USE_MOCK_DATA) return patchMockSlot(Number(slotId), 'confirmed')
  const res = await apiClient.post(
    `/scheduler/slots/${slotId}/confirm/${nurseId}`,
    undefined,
    { validateStatus: () => true },
  )
  const ok = res.status >= 200 && res.status < 300
  const candidate = ok ? unwrap(res.data) : undefined
  if (candidate && (candidate as any).id != null) return candidate
  const fallback = await getSlotById(slotId)
  if (!fallback) throw new Error('Slot not found after confirm')
  return fallback
}

export async function checkInAppointment(
  slotId: number | string,
): Promise<Slot> {
  if (ENV.USE_MOCK_DATA) return patchMockSlot(Number(slotId), 'checked_in')
  return postSlotTransition(slotId, 'check-in')
}

export async function cancelAppointment(
  slotId: number | string,
  reason: string,
): Promise<Slot> {
  if (ENV.USE_MOCK_DATA) return patchMockSlot(Number(slotId), 'canceled')
  return postSlotTransition(slotId, 'cancel', { reason })
}

