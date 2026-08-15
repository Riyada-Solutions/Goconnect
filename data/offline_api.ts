import { apiClient } from './api_client'
import { enqueue } from './offline_queue'
import { isEffectivelyOnline } from '@/context/NetworkContext'

export class OfflineQueuedError extends Error {
  readonly queued = true as const
  constructor() {
    super('Saved offline — will sync when connected')
    this.name = 'OfflineQueuedError'
  }
}

export interface MultipartFileRef {
  /** A `data:` URL (drawn signature) or a local `file://` URI (picked attachment). */
  uri: string
  name: string
  type: string
}

/** RN's FormData treats `{ uri, name, type }` as a file part. */
function toFilePart(file: MultipartFileRef) {
  return { uri: file.uri, name: file.name, type: file.type } as unknown as Blob
}

/** Reconstructs the exact multipart body used by `offlinePostMultipart`, shared
 *  with the sync-service replay path so a queued item posts identically to how
 *  it would have online. */
export function buildMultipartFormData(
  jsonBody: Record<string, unknown>,
  fields: Record<string, string>,
  files: Record<string, MultipartFileRef>,
): FormData {
  const fd = new FormData()
  fd.append('data', JSON.stringify(jsonBody))
  for (const [key, value] of Object.entries(fields)) fd.append(key, value)
  for (const [key, file] of Object.entries(files)) fd.append(key, toFilePart(file))
  return fd
}

/**
 * Drop-in wrapper for apiClient({ method, url, data }) — POST/PATCH/PUT/DELETE.
 * - When online: calls the API directly and returns the response.
 * - When offline: enqueues the request to SQLite and throws OfflineQueuedError
 *   so callers can distinguish "queued offline" from a real error.
 * - When NetInfo reports online but the request itself fails to reach the
 *   server (timeout, dropped connection, DNS failure — `error.response` is
 *   absent), falls back to queuing instead of surfacing a raw network error.
 *   A real API error (validation 4xx, server 5xx) still throws normally,
 *   since retrying a queued copy wouldn't fix it.
 */
export async function offlineMutate(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  body: Record<string, unknown> = {},
  visitId?: string,
): Promise<any> {
  // isInternetReachable is a probe that often comes back `null` (not yet
  // resolved) or a false negative on networks that block the probe target
  // even though real API traffic goes through fine. Only treat it as
  // offline when the probe explicitly reports `false` (see isEffectivelyOnline).
  const online = await isEffectivelyOnline()

  if (!online) {
    enqueue({ method, url, body, visitId })
    throw new OfflineQueuedError()
  }

  try {
    return await apiClient({ method, url, data: body })
  } catch (e: any) {
    if (e?.response) throw e // real API error — don't queue, let it surface
    enqueue({ method, url, body, visitId })
    throw new OfflineQueuedError()
  }
}

/** POST-only convenience wrapper around {@link offlineMutate}. */
export async function offlinePost(
  url: string,
  body: Record<string, unknown>,
  visitId?: string,
): Promise<any> {
  return offlineMutate('POST', url, body, visitId)
}

/**
 * Multipart counterpart to `offlinePost`, for saves that carry an inline
 * (not-yet-uploaded) file — e.g. a signature PNG drawn while offline, where
 * the `/signatures/upload` pre-upload step itself can't reach the server.
 *
 * The file(s) are stored as base64 data URLs inside the queued JSON body
 * (SQLite has no separate blob/multipart concept), tagged with `__multipart`
 * so `services/SyncService.ts` knows to rebuild the FormData identically on
 * replay via `buildMultipartFormData`.
 *
 * - When online: posts multipart directly, same as before.
 * - When offline, or when the request fails with no server response (dropped
 *   connection/timeout): queues instead of throwing a raw network error.
 */
export async function offlinePostMultipart(
  url: string,
  parts: { jsonBody: Record<string, unknown>; fields?: Record<string, string>; files: Record<string, MultipartFileRef> },
  visitId?: string,
): Promise<any> {
  const { jsonBody, fields = {}, files } = parts
  const online = await isEffectivelyOnline()

  const queueBody: Record<string, unknown> = { __multipart: true, jsonBody, fields, files }

  if (!online) {
    enqueue({ method: 'POST', url, body: queueBody, visitId })
    throw new OfflineQueuedError()
  }

  try {
    const fd = buildMultipartFormData(jsonBody, fields, files)
    return await apiClient.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  } catch (e: any) {
    if (e?.response) throw e
    enqueue({ method: 'POST', url, body: queueBody, visitId })
    throw new OfflineQueuedError()
  }
}
