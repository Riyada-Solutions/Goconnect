import NetInfo from '@react-native-community/netinfo'
import { apiClient } from './api_client'
import { enqueue } from './offline_queue'

export class OfflineQueuedError extends Error {
  readonly queued = true as const
  constructor() {
    super('Saved offline — will sync when connected')
    this.name = 'OfflineQueuedError'
  }
}

/**
 * Drop-in wrapper for apiClient.post.
 * - When online: calls the API directly and returns the response.
 * - When offline: enqueues the request to SQLite and throws OfflineQueuedError
 *   so callers can distinguish "queued offline" from a real error.
 * - When NetInfo reports online but the request itself fails to reach the
 *   server (timeout, dropped connection, DNS failure — `error.response` is
 *   absent), falls back to queuing instead of surfacing a raw network error.
 *   A real API error (validation 4xx, server 5xx) still throws normally,
 *   since retrying a queued copy wouldn't fix it.
 */
export async function offlinePost(
  url: string,
  body: Record<string, unknown>,
  visitId?: string,
): Promise<any> {
  const state = await NetInfo.fetch()
  // isInternetReachable is a probe that often comes back `null` (not yet
  // resolved) or a false negative on networks that block the probe target
  // even though real API traffic goes through fine. Only treat it as
  // offline when the probe explicitly reports `false`.
  const online = !!state.isConnected && state.isInternetReachable !== false

  if (!online) {
    enqueue({ method: 'POST', url, body, visitId })
    throw new OfflineQueuedError()
  }

  try {
    return await apiClient.post(url, body)
  } catch (e: any) {
    if (e?.response) throw e // real API error — don't queue, let it surface
    enqueue({ method: 'POST', url, body, visitId })
    throw new OfflineQueuedError()
  }
}
