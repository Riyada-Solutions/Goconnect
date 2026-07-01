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
 */
export async function offlinePost(
  url: string,
  body: Record<string, unknown>,
  visitId?: string,
): Promise<any> {
  const state = await NetInfo.fetch()
  const online = !!(state.isConnected && state.isInternetReachable)

  if (online) {
    return apiClient.post(url, body)
  }

  enqueue({ method: 'POST', url, body, visitId })
  throw new OfflineQueuedError()
}
