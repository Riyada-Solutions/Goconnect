import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetSlots, mockGetSlotById } from './mock/scheduler_mock'
import type { Slot } from './models/scheduler'

export async function getSlots(): Promise<Slot[]> {
  if (ENV.USE_MOCK_DATA) return mockGetSlots()
  const { data } = await apiClient.get<Slot[]>('/scheduler/slots')
  return data
}

export async function getSlotById(id: number): Promise<Slot | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetSlotById(id)
  const { data } = await apiClient.get<Slot>(`/scheduler/slots/${id}`)
  return data
}

// ─── Status transitions ─────────────────────────────────────────────────────
//
// Each transition returns the updated Slot so the UI can refresh its cache.
// Mock mode patches the in-memory slot and resolves; real mode posts to the
// backend.

const unwrap = (raw: any): Slot => raw?.data ?? raw

async function patchMockSlot(id: number, status: Slot['status']): Promise<Slot> {
  await new Promise((r) => setTimeout(r, 300))
  const current = await mockGetSlotById(id)
  if (!current) throw new Error('Slot not found')
  ;(current as any).status = status
  return current
}

export async function confirmAppointment(slotId: number): Promise<Slot> {
  if (ENV.USE_MOCK_DATA) return patchMockSlot(slotId, 'confirmed')
  const res = await apiClient.post(`/scheduler/slots/${slotId}/confirm`)
  return unwrap(res.data)
}

export async function checkInAppointment(slotId: number): Promise<Slot> {
  if (ENV.USE_MOCK_DATA) return patchMockSlot(slotId, 'checked_in')
  const res = await apiClient.post(`/scheduler/slots/${slotId}/check-in`)
  return unwrap(res.data)
}

