import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetSlots, mockGetSlotById } from './mock/scheduler_mock'
import type { Slot } from '../types/scheduler'

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
