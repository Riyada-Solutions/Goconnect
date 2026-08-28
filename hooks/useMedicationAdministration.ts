import {
  getMedicationAdministration,
  MAR_DEFAULT_DAYS,
  MAR_MAX_DAYS,
  marDateOffset,
} from '@/data/medication_administration_repository'
import type { MedicationAdministrationRecord } from '@/data/models/medicationAdministration'
import { useOfflineQuery } from './useOfflineQuery'

/**
 * MAR grid for one patient over a date range.
 *
 * Read-only, so the offline story is simply "serve the last cached range" —
 * there is nothing to reconcile. Each range is cached under its own key so
 * flipping back to a previously-viewed window still works with no signal.
 */
export function useMedicationAdministration(
  patientId: number,
  startDate: string,
  endDate: string,
  enabled = true,
) {
  return useOfflineQuery<MedicationAdministrationRecord>({
    queryKey: ['medication-administration', patientId, startDate, endDate],
    queryFn: () => getMedicationAdministration(patientId, startDate, endDate),
    cacheTtl: 5 * 60 * 1000,
    cachePrefix: 'medication-administration',
    enabled: enabled && !!patientId,
  })
}

export { MAR_DEFAULT_DAYS, MAR_MAX_DAYS, marDateOffset }
