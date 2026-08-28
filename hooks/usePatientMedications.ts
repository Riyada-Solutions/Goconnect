import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  FALLBACK_MEDICATION_OPTIONS,
  MEDICATIONS_PER_PAGE,
  administerPatientMedication,
  createPatientMedications,
  deletePatientMedication,
  getMedicationOptions,
  getMedicationRefills,
  getPatientMedication,
  getPatientMedicationsPage,
  refillPatientMedication,
  searchDrugs,
  setPatientMedicationStatus,
  updatePatientMedication,
} from '@/data/patient_medication_repository'
import type {
  Drug,
  MedicationOptions,
  MedicationRefillEntry,
  MedicationType,
  PatientMedication,
} from '@/data/models/patientMedication'

import { useOfflineInfiniteQuery } from './useOfflineInfiniteQuery'
import { useOfflineQuery } from './useOfflineQuery'

const OPTIONS_TTL = 24 * 60 * 60 * 1000 // static lookups — a day is plenty
const LIST_TTL = 5 * 60 * 1000

/** The dropdown sources. Cached for a day; served from cache when offline. */
export function useMedicationOptions(enabled = true) {
  const query = useOfflineQuery<MedicationOptions>({
    queryKey: ['medication-options'],
    queryFn: getMedicationOptions,
    cacheTtl: OPTIONS_TTL,
    cachePrefix: 'medication-options',
    enabled,
  })
  return { ...query, options: query.data ?? FALLBACK_MEDICATION_OPTIONS }
}

/**
 * One section of the list (Active or Deactivated) for one type.
 * `search` should already be debounced by the caller (§4 — 300 ms).
 */
export function usePatientMedications(
  patientId: number,
  type: MedicationType,
  status: boolean,
  search = '',
  enabled = true,
) {
  return useOfflineInfiniteQuery({
    queryKey: ['patient-medications', patientId, type, status ? 'active' : 'inactive', search],
    queryFn: (pageParam) =>
      getPatientMedicationsPage(patientId, {
        type,
        status,
        search: search || undefined,
        page: pageParam as number,
        perPage: MEDICATIONS_PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last: any) =>
      last?.hasMore ? (last.meta?.current_page ?? 0) + 1 : undefined,
    cacheTtl: LIST_TTL,
    cachePrefix: 'patient-medications',
    enabled: enabled && !!patientId,
  })
}

/** Full detail for one medication — the sheet behind the drug name. */
export function usePatientMedication(patientId: number, medicationId: number | null) {
  return useOfflineQuery<PatientMedication>({
    queryKey: ['patient-medication', patientId, medicationId],
    queryFn: () => getPatientMedication(patientId, medicationId as number),
    cacheTtl: LIST_TTL,
    cachePrefix: 'patient-medication',
    enabled: !!patientId && !!medicationId,
  })
}

/** Refill history; only fetched once the nurse opens that row. */
export function useMedicationRefills(patientId: number, medicationId: number | null, enabled = true) {
  return useOfflineQuery<MedicationRefillEntry[]>({
    queryKey: ['medication-refills', patientId, medicationId],
    queryFn: () => getMedicationRefills(patientId, medicationId as number),
    cacheTtl: LIST_TTL,
    cachePrefix: 'medication-refills',
    enabled: enabled && !!patientId && !!medicationId,
  })
}

/**
 * Drug autocomplete. Plain `useQuery` — a search box is never useful offline
 * and caching every keystroke would only pollute the offline store.
 */
export function useDrugSearch(term: string, enabled = true) {
  const trimmed = term.trim()
  return useQuery<Drug[]>({
    queryKey: ['drug-search', trimmed],
    queryFn: () => searchDrugs(trimmed),
    enabled: enabled && trimmed.length >= 2,
    staleTime: 60 * 1000,
    retry: 0,
  })
}

/**
 * Save / Delete / Stop / Reactivate move a row between the two sections, so
 * every write invalidates both lists plus the detail entry (§9).
 */
function useMedicationsInvalidator(patientId: number) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['patient-medications', patientId] })
    qc.invalidateQueries({ queryKey: ['patient-medication', patientId] })
  }
}

export interface CreateMedicationsInput {
  body: Record<string, unknown>
}

export function useCreatePatientMedications(patientId: number, visitId?: number) {
  const invalidate = useMedicationsInvalidator(patientId)
  return useMutation<PatientMedication[], Error, CreateMedicationsInput>({
    mutationFn: ({ body }) => createPatientMedications(patientId, body, visitId),
    onSuccess: invalidate,
  })
}

export interface UpdateMedicationInput {
  medicationId: number
  body: Record<string, unknown>
}

export function useUpdatePatientMedication(patientId: number, visitId?: number) {
  const invalidate = useMedicationsInvalidator(patientId)
  return useMutation<PatientMedication, Error, UpdateMedicationInput>({
    mutationFn: ({ medicationId, body }) => updatePatientMedication(patientId, medicationId, body, visitId),
    onSuccess: invalidate,
  })
}

export function useDeletePatientMedication(patientId: number, visitId?: number) {
  const invalidate = useMedicationsInvalidator(patientId)
  return useMutation<void, Error, number>({
    mutationFn: (medicationId) => deletePatientMedication(patientId, medicationId, visitId),
    onSuccess: invalidate,
  })
}

export function useSetMedicationStatus(patientId: number, visitId?: number) {
  const invalidate = useMedicationsInvalidator(patientId)
  return useMutation<PatientMedication, Error, { medicationId: number; active: boolean }>({
    mutationFn: ({ medicationId, active }) =>
      setPatientMedicationStatus(patientId, medicationId, active, visitId),
    onSuccess: invalidate,
  })
}

export function useAdministerMedication(patientId: number, visitId?: number) {
  const invalidate = useMedicationsInvalidator(patientId)
  return useMutation<
    PatientMedication,
    Error,
    { medicationId: number; administeredBy: string; reason?: string }
  >({
    mutationFn: ({ medicationId, administeredBy, reason }) =>
      administerPatientMedication(
        patientId,
        medicationId,
        { administered_by: administeredBy, ...(reason ? { reason } : {}) },
        visitId,
      ),
    onSuccess: invalidate,
  })
}

export function useRefillMedication(patientId: number, visitId?: number) {
  const qc = useQueryClient()
  const invalidate = useMedicationsInvalidator(patientId)
  return useMutation<PatientMedication, Error, { medicationId: number; notes?: string }>({
    mutationFn: ({ medicationId, notes }) =>
      refillPatientMedication(patientId, medicationId, notes, visitId),
    onSuccess: (_data, { medicationId }) => {
      invalidate()
      // §9 — a refill writes a history row, so that list is stale too.
      qc.invalidateQueries({ queryKey: ['medication-refills', patientId, medicationId] })
    },
  })
}

export { MEDICATIONS_PER_PAGE }
