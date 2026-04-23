import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getVisits,
  getVisitById,
  getMedications,
  getInventory,
  submitDoctorProgressNote,
  submitFlowSheet,
  submitNursingProgressNote,
  submitReferral,
  submitRefusal,
  submitSariScreening,
  submitSocialWorkerProgressNote,
  submitVisitSignature,
} from '../data/visit_repository'
import type { DoctorProgressNoteInput } from '../types/doctorProgressNote'
import type { FlowSheet } from '../types/flowSheet'
import type { ReferralInput } from '../types/referral'
import type { RefusalInput } from '../types/refusal'
import type { SariScreeningInput } from '../types/sariScreening'
import type { SocialWorkerLocation } from '../types/socialWorkerProgressNote'
import type { VisitSignatureKind } from '../types/visitSignature'

export function useVisits() {
  return useQuery({
    queryKey: ['visits'],
    queryFn: getVisits,
    staleTime: 30_000,
  })
}

export function useVisit(id: number) {
  return useQuery({
    queryKey: ['visits', id],
    queryFn: () => getVisitById(id),
    staleTime: 30_000,
    enabled: !!id,
  })
}

export function useMedications() {
  return useQuery({
    queryKey: ['medications'],
    queryFn: getMedications,
    staleTime: 60_000,
  })
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
    staleTime: 60_000,
  })
}

export function useSubmitFlowSheet(visitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<FlowSheet, 'visitId'>) => submitFlowSheet({ ...payload, visitId } as FlowSheet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', visitId] })
    },
  })
}

export function useSubmitNursingProgressNote(visitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (note: string) => submitNursingProgressNote({ visitId, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', visitId] })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}

export function useSubmitVisitSignature(visitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { kind: VisitSignatureKind; dataUrl: string; signedAt?: string }) =>
      submitVisitSignature({
        visitId,
        kind: input.kind,
        dataUrl: input.dataUrl,
        signedAt: input.signedAt ?? new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', visitId] })
    },
  })
}

export function useSubmitSariScreening(visitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<SariScreeningInput, 'visitId'>) =>
      submitSariScreening({ visitId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', visitId] })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}

export function useSubmitRefusal(visitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<RefusalInput, 'visitId'>) => submitRefusal({ visitId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', visitId] })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}

export function useSubmitDoctorProgressNote(visitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<DoctorProgressNoteInput, 'visitId'>) =>
      submitDoctorProgressNote({ visitId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', visitId] })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}

export function useSubmitReferral(visitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<ReferralInput, 'visitId'>) =>
      submitReferral({ visitId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', visitId] })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}

export function useSubmitSocialWorkerProgressNote(visitId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { note: string; location: SocialWorkerLocation }) =>
      submitSocialWorkerProgressNote({ visitId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', visitId] })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}
