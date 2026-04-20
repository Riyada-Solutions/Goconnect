import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import {
  mockGetVisits,
  mockGetVisitById,
  mockGetMedications,
  mockGetInventory,
  mockSubmitFlowSheet,
  mockSubmitNursingProgressNote,
  mockSubmitSocialWorkerProgressNote,
  mockSubmitReferral,
  mockSubmitDoctorProgressNote,
  mockSubmitRefusal,
  mockSubmitVisitSignature,
} from './mock/visits_mock'
import type { Visit, DialysisMedication, InventoryItem } from '../types/visit'
import type { FlowSheet } from '../types/flowSheet'
import type { NursingProgressNote, NursingProgressNoteInput } from '../types/nursingProgressNote'
import type {
  SocialWorkerProgressNote,
  SocialWorkerProgressNoteInput,
} from '../types/socialWorkerProgressNote'
import type { Referral, ReferralInput } from '../types/referral'
import type { DoctorProgressNote, DoctorProgressNoteInput } from '../types/doctorProgressNote'
import type { Refusal, RefusalInput } from '../types/refusal'
import type { VisitSignature, VisitSignatureInput } from '../types/visitSignature'

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

export async function submitFlowSheet(payload: FlowSheet): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockSubmitFlowSheet(payload)
  await apiClient.post(`/visits/${payload.visitId}/flow-sheet`, payload)
}

export async function submitNursingProgressNote(payload: NursingProgressNoteInput): Promise<NursingProgressNote> {
  if (ENV.USE_MOCK_DATA) return mockSubmitNursingProgressNote(payload)
  const { data } = await apiClient.post<NursingProgressNote>(
    `/visits/${payload.visitId}/nursing-progress-notes`,
    { note: payload.note },
  )
  return data
}

export async function submitDoctorProgressNote(
  payload: DoctorProgressNoteInput,
): Promise<DoctorProgressNote> {
  if (ENV.USE_MOCK_DATA) return mockSubmitDoctorProgressNote(payload)
  const { data } = await apiClient.post<DoctorProgressNote>(
    `/visits/${payload.visitId}/doctor-progress-notes`,
    { note: payload.note, isAddendum: payload.isAddendum, parentNoteId: payload.parentNoteId },
  )
  return data
}

export async function submitVisitSignature(payload: VisitSignatureInput): Promise<VisitSignature> {
  if (ENV.USE_MOCK_DATA) return mockSubmitVisitSignature(payload)
  const { data } = await apiClient.post<VisitSignature>(`/visits/${payload.visitId}/signatures`, {
    kind: payload.kind,
    dataUrl: payload.dataUrl,
    signedAt: payload.signedAt,
  })
  return data
}

export async function submitRefusal(payload: RefusalInput): Promise<Refusal> {
  if (ENV.USE_MOCK_DATA) return mockSubmitRefusal(payload)
  const { data } = await apiClient.post<Refusal>(`/visits/${payload.visitId}/refusals`, payload)
  return data
}

export async function submitReferral(payload: ReferralInput): Promise<Referral> {
  if (ENV.USE_MOCK_DATA) return mockSubmitReferral(payload)
  const { data } = await apiClient.post<Referral>(`/visits/${payload.visitId}/referrals`, payload)
  return data
}

export async function submitSocialWorkerProgressNote(
  payload: SocialWorkerProgressNoteInput,
): Promise<SocialWorkerProgressNote> {
  if (ENV.USE_MOCK_DATA) return mockSubmitSocialWorkerProgressNote(payload)
  const { data } = await apiClient.post<SocialWorkerProgressNote>(
    `/visits/${payload.visitId}/social-worker-progress-notes`,
    { note: payload.note, location: payload.location },
  )
  return data
}
