import NetInfo from '@react-native-community/netinfo'
import { apiClient } from '@/data/api_client'
import { peekAll, markDone, markFailed } from '@/data/offline_queue'

const MAX_RETRIES = 5

let _invalidateVisits: ((visitId: string) => void) | null = null

/** Register a callback that the sync service uses to invalidate React Query caches. */
export function registerVisitInvalidator(fn: (visitId: string) => void): void {
  _invalidateVisits = fn
}

/**
 * Replay all queued mutations against the API in FIFO order.
 * Stops on the first failure to preserve ordering (so later mutations
 * that depend on earlier ones aren't replayed out of sequence).
 */
export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const pending = peekAll()
  if (pending.length === 0) return { synced: 0, failed: 0 }

  const state = await NetInfo.fetch()
  if (!state.isConnected || !state.isInternetReachable) {
    return { synced: 0, failed: 0 }
  }

  let synced = 0
  let failed = 0
  const invalidateVisitIds = new Set<string>()

  for (const item of pending) {
    if (item.retries >= MAX_RETRIES) {
      failed++
      continue
    }
    try {
      await apiClient({ method: item.method as any, url: item.url, data: item.body })
      markDone(item.id)
      synced++
      if (item.visitId) invalidateVisitIds.add(item.visitId)
    } catch (e: any) {
      markFailed(item.id, e?.message ?? 'Unknown error')
      failed++
      break // stop on first failure to preserve ordering
    }
  }

  for (const visitId of invalidateVisitIds) {
    _invalidateVisits?.(visitId)
  }

  return { synced, failed }
}
