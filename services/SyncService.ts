import NetInfo from '@react-native-community/netinfo'
import { apiClient } from '@/data/api_client'
import { buildMultipartFormData } from '@/data/offline_api'
import { getItem, peekAll, markDone, markFailed, type QueuedMutation } from '@/data/offline_queue'

const MAX_RETRIES = 5

// Before giving up on an item and auto-skipping to the next one, retry it in
// place when the failure looks like a transient network blip (no HTTP
// response at all — timeout/dropped connection): wait 5s, retry; if it fails
// with the same kind of network error again, wait 10s and retry once more.
// After that it's marked failed and flushQueue() moves on to the next item
// (only blocking later items for the *same* visit) — the user can still tap
// "Retry" manually on the stuck one later.
const INLINE_RETRY_DELAYS_MS = [5000, 10000]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let _invalidateVisits: ((visitId: string) => void) | null = null

/** Register a callback that the sync service uses to invalidate React Query caches. */
export function registerVisitInvalidator(fn: (visitId: string) => void): void {
  _invalidateVisits = fn
}

const activityListeners = new Set<(itemId: number | null) => void>()

/**
 * Subscribe to "which queued item is currently being attempted" (null when
 * idle). Lets the pending-changes UI show a live loading spinner during
 * automatic background retries, not just manual "Retry" taps.
 */
export function subscribeToSyncActivity(fn: (itemId: number | null) => void): () => void {
  activityListeners.add(fn)
  return () => activityListeners.delete(fn)
}

function notifySyncActivity(itemId: number | null): void {
  activityListeners.forEach((fn) => fn(itemId))
}

/**
 * Attempt one queued item against the API, retrying in place per
 * INLINE_RETRY_DELAYS_MS when the failure is a transient network error (no
 * `.response` at all). A real server response (4xx/5xx) means retrying
 * immediately would just fail the same way, so it gives up after the first
 * attempt in that case.
 */
async function attemptItem(item: QueuedMutation): Promise<{ ok: true } | { ok: false; error: string }> {
  notifySyncActivity(item.id)
  try {
    let lastError = 'Unknown error'
    const totalAttempts = INLINE_RETRY_DELAYS_MS.length + 1
    const multipart = item.body && (item.body as any).__multipart
    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      try {
        if (multipart) {
          const { jsonBody, fields, files } = item.body as any
          const fd = buildMultipartFormData(jsonBody, fields ?? {}, files ?? {})
          await apiClient.post(item.url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
          await apiClient({ method: item.method as any, url: item.url, data: item.body })
        }
        return { ok: true }
      } catch (e: any) {
        lastError = e?.message ?? 'Unknown error'
        const isTransientNetworkError = !e?.response
        if (!isTransientNetworkError || attempt > INLINE_RETRY_DELAYS_MS.length) break
        await sleep(INLINE_RETRY_DELAYS_MS[attempt - 1])
      }
    }
    return { ok: false, error: lastError }
  } finally {
    notifySyncActivity(null)
  }
}

/**
 * Replay all queued mutations against the API in FIFO order.
 * A failure only blocks *later items for the same visit* (to preserve
 * ordering for mutations that depend on one another) — it does not block
 * unrelated visits' queued items from syncing.
 */
export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const pending = peekAll()
  if (pending.length === 0) return { synced: 0, failed: 0 }

  const state = await NetInfo.fetch()
  // See data/offline_api.ts: isInternetReachable can be a stale/false
  // negative `null`/`false` probe result even while genuinely online, so
  // only an explicit `false` counts as offline.
  if (!state.isConnected || state.isInternetReachable === false) {
    return { synced: 0, failed: 0 }
  }

  let synced = 0
  let failed = 0
  const invalidateVisitIds = new Set<string>()
  const blockedVisitIds = new Set<string>()

  for (const item of pending) {
    if (item.visitId && blockedVisitIds.has(item.visitId)) {
      failed++
      continue
    }
    if (item.retries >= MAX_RETRIES) {
      failed++
      if (item.visitId) blockedVisitIds.add(item.visitId)
      continue
    }
    const result = await attemptItem(item)
    if (result.ok) {
      markDone(item.id)
      synced++
      if (item.visitId) invalidateVisitIds.add(item.visitId)
    } else {
      markFailed(item.id, result.error)
      failed++
      if (item.visitId) blockedVisitIds.add(item.visitId)
    }
  }

  for (const visitId of invalidateVisitIds) {
    _invalidateVisits?.(visitId)
  }

  return { synced, failed }
}

/**
 * Manually retry a single queued item (e.g. the user tapped "Retry" on one
 * stuck item in the pending-changes list). Ignores MAX_RETRIES since this is
 * an explicit user action, not an automatic background attempt.
 */
export async function retryItem(id: number): Promise<{ ok: boolean; error?: string }> {
  const item = getItem(id)
  if (!item) return { ok: false, error: 'Item no longer queued' }

  const result = await attemptItem(item)
  if (result.ok) {
    markDone(item.id)
    if (item.visitId) _invalidateVisits?.(item.visitId)
    return { ok: true }
  }
  markFailed(item.id, result.error)
  return { ok: false, error: result.error }
}
