import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isEffectivelyOnline } from '@/context/NetworkContext'
import { getMedicationOptions, getPatientMedicationsPage } from '@/data/patient_medication_repository'
import { getDialysisOrderOptions, getDialysisOrdersPage } from '@/data/dialysis_order_repository'
import { getHospitals } from '@/data/hospitals_repository'
import { getMachines } from '@/data/machines_repository'
import { getInventoryPage } from '@/data/inventory_repository'
import { getMedicationAdministration } from '@/data/medication_administration_repository'
import { getLabResultsByPatient } from '@/data/labResult_repository'
import type { MedicationType } from '@/data/models/patientMedication'

interface PrefetchOptions {
  patientId: number | null
  visitId: number | null
  permissions: {
    canViewMedications: boolean
    canViewDialysisOrders: boolean
    canViewMAR: boolean
  }
  enabled?: boolean
}

/**
 * Proactively prefetch all data needed for a visit's forms when checking in.
 * Ensures the entire visit can be conducted offline once data is cached.
 *
 * Fires once per (patientId, visitId) pair — guarded by a ref to prevent
 * re-fetches on every re-render/focus.
 */
export function usePrefetchVisitData({
  patientId,
  visitId,
  permissions,
  enabled = true,
}: PrefetchOptions) {
  const qc = useQueryClient()
  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (!enabled || !patientId || !visitId || hasFiredRef.current) return

    const prefetch = async () => {
      const online = await isEffectivelyOnline()
      if (!online) return // nothing to prefetch if already offline

      hasFiredRef.current = true

      // Org-wide reference data (cached 24h or longer, prefetch respects staleTime)
      try {
        await qc.prefetchQuery({
          queryKey: ['medication-options'],
          queryFn: getMedicationOptions,
        })
      } catch {
        // non-fatal
      }

      if (permissions.canViewDialysisOrders) {
        try {
          await qc.prefetchQuery({
            queryKey: ['dialysis-order-options'],
            queryFn: getDialysisOrderOptions,
          })
        } catch {
          // non-fatal
        }
      }

      // Always prefetch — used by ReferralForm
      try {
        await qc.prefetchQuery({
          queryKey: ['hospitals'],
          queryFn: getHospitals,
        })
      } catch {
        // non-fatal
      }

      // Machines — used by FlowSheet if nurse can view vitals
      try {
        await qc.prefetchQuery({
          queryKey: ['machines'],
          queryFn: getMachines,
        })
      } catch {
        // non-fatal
      }

      // Patient-specific data
      if (permissions.canViewMedications) {
        // Prefetch both active and inactive home and dialysis medications (first page)
        const medicationConfigs: Array<[MedicationType, boolean]> = [
          ['home_medications', true],
          ['home_medications', false],
          ['dialysis_medications', true],
          ['dialysis_medications', false],
        ]
        for (const [type, status] of medicationConfigs) {
          try {
            await qc.prefetchInfiniteQuery({
              queryKey: ['patient-medications', patientId, type, status ? 'active' : 'inactive', ''],
              queryFn: (ctx) =>
                getPatientMedicationsPage(patientId, {
                  type,
                  status,
                  page: (ctx.pageParam as number) || 1,
                  perPage: 15,
                }),
              initialPageParam: 1,
              getNextPageParam: (last: any) => (last?.hasMore ? (last.meta?.current_page ?? 0) + 1 : undefined),
            })
          } catch {
            // non-fatal
          }
        }
      }

      if (permissions.canViewDialysisOrders) {
        try {
          await qc.prefetchInfiniteQuery({
            queryKey: ['dialysis-orders', patientId],
            queryFn: (ctx) =>
              getDialysisOrdersPage(patientId, {
                page: (ctx.pageParam as number) || 1,
                perPage: 10,
              }),
            initialPageParam: 1,
            getNextPageParam: (last: any) => (last?.hasMore ? (last.meta?.current_page ?? 0) + 1 : undefined),
          })
        } catch {
          // non-fatal
        }
      }

      // Inventory — always prefetch (PatientInventorySection always renders)
      try {
        await qc.prefetchInfiniteQuery({
          queryKey: ['patient-inventory', patientId, visitId, ''],
          queryFn: (ctx) =>
            getInventoryPage(patientId, visitId, {
              page: (ctx.pageParam as number) || 1,
              perPage: 20,
              search: '',
            }),
          initialPageParam: 1,
          getNextPageParam: (last: any) => (last?.hasMore ? (last.meta?.current_page ?? 0) + 1 : undefined),
        })
      } catch {
        // non-fatal
      }

      if (permissions.canViewMAR) {
        try {
          // Default to past 7 days — this is what MARForm uses on first load
          const today = new Date()
          const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          await qc.prefetchQuery({
            queryKey: [
              'medication-administration',
              patientId,
              startDate.toISOString().slice(0, 10),
              today.toISOString().slice(0, 10),
              7,
            ],
            queryFn: () => getMedicationAdministration(patientId, startDate, today),
          })
        } catch {
          // non-fatal
        }
      }

      // Lab results — secondary, but prefetch if online
      try {
        await qc.prefetchQuery({
          queryKey: ['lab-results', patientId],
          queryFn: () => getLabResultsByPatient(patientId),
        })
      } catch {
        // non-fatal
      }
    }

    prefetch()
  }, [qc, patientId, visitId, permissions, enabled])
}
