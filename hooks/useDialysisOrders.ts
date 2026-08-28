import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  FALLBACK_DIALYSIS_ORDER_OPTIONS,
  acknowledgeDialysisOrder,
  createDialysisOrder,
  deleteDialysisOrder,
  duplicateDialysisOrder,
  getDialysisOrder,
  getDialysisOrderOptions,
  getDialysisOrdersPage,
  updateDialysisOrder,
  DIALYSIS_ORDERS_PER_PAGE,
} from '@/data/dialysis_order_repository'
import type { DialysisOrder, DialysisOrderOptions } from '@/data/models/dialysisOrder'
import { useOfflineInfiniteQuery } from './useOfflineInfiniteQuery'
import { useOfflineQuery } from './useOfflineQuery'

const OPTIONS_TTL = 24 * 60 * 60 * 1000 // the rule payload changes rarely

/**
 * The option lists + the 24 rules. Cached for a day and served from the
 * offline cache when there's no connection; the bundled fallback only kicks
 * in when the app has genuinely never seen the payload.
 */
export function useDialysisOrderOptions(enabled = true) {
  const query = useOfflineQuery<DialysisOrderOptions>({
    queryKey: ['dialysis-order-options'],
    queryFn: getDialysisOrderOptions,
    cacheTtl: OPTIONS_TTL,
    cachePrefix: 'dialysis-order-options',
    enabled,
  })
  return { ...query, options: query.data ?? FALLBACK_DIALYSIS_ORDER_OPTIONS }
}

/** Paginated order history for one patient, newest first. */
export function useDialysisOrders(patientId: number, enabled = true) {
  return useOfflineInfiniteQuery({
    queryKey: ['dialysis-orders', patientId],
    queryFn: (pageParam) => getDialysisOrdersPage(patientId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last: any) =>
      last?.hasMore ? (last.meta?.current_page ?? 0) + 1 : undefined,
    cacheTtl: 5 * 60 * 1000,
    cachePrefix: 'dialysis-orders',
    enabled: enabled && !!patientId,
  })
}

/** One order with its server-computed `visibility` — used by the view screen. */
export function useDialysisOrder(patientId: number, orderId: number | null) {
  return useOfflineQuery<DialysisOrder>({
    queryKey: ['dialysis-order', patientId, orderId],
    queryFn: () => getDialysisOrder(patientId, orderId as number),
    cacheTtl: 5 * 60 * 1000,
    cachePrefix: 'dialysis-order',
    enabled: !!patientId && !!orderId,
  })
}

/** Every write invalidates the list; `useVisit` is untouched (orders are patient-scoped). */
function useOrdersInvalidator(patientId: number) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['dialysis-orders', patientId] })
    qc.invalidateQueries({ queryKey: ['dialysis-order', patientId] })
  }
}

export interface DialysisOrderSaveInput {
  body: Record<string, unknown>
  /** Present = update/duplicate; absent = create. */
  orderId?: number
  /** Save-as-New: create a fresh order from these values, keep the original. */
  asNew?: boolean
}

export function useSaveDialysisOrder(patientId: number, visitId?: number) {
  const invalidate = useOrdersInvalidator(patientId)
  return useMutation<{ order: DialysisOrder; changed: boolean }, Error, DialysisOrderSaveInput>({
    mutationFn: async ({ body, orderId, asNew }) => {
      if (orderId && asNew) {
        return { order: await duplicateDialysisOrder(patientId, orderId, body, visitId), changed: true }
      }
      if (orderId) return updateDialysisOrder(patientId, orderId, body, visitId)
      return { order: await createDialysisOrder(patientId, body, visitId), changed: true }
    },
    onSuccess: invalidate,
  })
}

export function useDeleteDialysisOrder(patientId: number, visitId?: number) {
  const invalidate = useOrdersInvalidator(patientId)
  return useMutation<void, Error, number>({
    mutationFn: (orderId) => deleteDialysisOrder(patientId, orderId, visitId),
    onSuccess: invalidate,
  })
}

export function useAcknowledgeDialysisOrder(patientId: number, visitId?: number) {
  const invalidate = useOrdersInvalidator(patientId)
  return useMutation<DialysisOrder, Error, number>({
    mutationFn: (orderId) => acknowledgeDialysisOrder(patientId, orderId, visitId),
    onSuccess: invalidate,
  })
}

export { DIALYSIS_ORDERS_PER_PAGE }
