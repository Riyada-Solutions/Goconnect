import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import {
  mockGetVisits,
  mockGetVisitById,
  mockGetMedications,
  mockGetInventory,
} from './mock/visits_mock'
import type { Visit, DialysisMedication, InventoryItem } from '../types/visit'

export async function getVisits(): Promise<Visit[]> {
  if (ENV.USE_MOCK_DATA) return mockGetVisits()
  const { data } = await apiClient.get<Visit[]>('/visits')
  return data
}

export async function getVisitById(id: number): Promise<Visit | undefined> {
  if (ENV.USE_MOCK_DATA) return mockGetVisitById(id)
  const { data } = await apiClient.get<Visit>(`/visits/${id}`)
  return data
}

export async function getMedications(): Promise<DialysisMedication[]> {
  if (ENV.USE_MOCK_DATA) return mockGetMedications()
  const { data } = await apiClient.get<DialysisMedication[]>('/medications')
  return data
}

export async function getInventory(): Promise<InventoryItem[]> {
  if (ENV.USE_MOCK_DATA) return mockGetInventory()
  const { data } = await apiClient.get<InventoryItem[]>('/inventory')
  return data
}
