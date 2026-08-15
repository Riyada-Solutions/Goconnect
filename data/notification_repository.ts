import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { offlineMutate } from './offline_api'
import {
  mockDeleteNotification,
  mockFetchNotifications,
  mockFetchUnreadCount,
  mockMarkAllRead,
  mockMarkNotificationRead,
} from './mock/notifications_mock'
import type {
  NotificationListParams,
  NotificationListResponse,
} from './models/notification'

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

/** `GET /api/notifications?filter=all|unread&per_page=N&page=N` */
export async function fetchNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResponse> {
  const { filter = 'all', per_page = 50, page = 1 } = params
  if (ENV.USE_MOCK_DATA) return mockFetchNotifications(filter, page, per_page)
  try {
    const res = await apiClient.get('/notifications', {
      params: { filter, per_page, page },
    })
    const body = res.data as any
    return {
      data: Array.isArray(body?.data) ? body.data : [],
      meta: body?.meta ?? { current_page: 1, last_page: 1, per_page, total: 0 },
    }
  } catch (error) {
    console.error('[fetchNotifications] Error (returning empty):', {
      error: String(error),
      message: (error as any)?.message,
    })
    return { data: [], meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 } }
  }
}

/** `GET /api/notifications/unread-count` → `{ count: number }` */
export async function fetchUnreadCount(): Promise<{ count: number }> {
  if (ENV.USE_MOCK_DATA) return mockFetchUnreadCount()
  try {
    const res = await apiClient.get('/notifications/unread-count')
    return unwrap<{ count: number }>(res.data)
  } catch (error) {
    console.error('[fetchUnreadCount] Error (returning zero):', {
      error: String(error),
      message: (error as any)?.message,
    })
    return { count: 0 }
  }
}

/** `POST /api/notifications/:id/read` — 204 No Content. Queues offline (UI already
 *  patches read-state optimistically via onMutate, so a queued sync is invisible). */
export async function markNotificationRead(id: number): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockMarkNotificationRead(id)
  await offlineMutate('POST', `/notifications/${id}/read`)
}

/** `POST /api/notifications/read-all` → `{ markedCount: number }`. Queues offline. */
export async function markAllNotificationsRead(): Promise<{ markedCount: number }> {
  if (ENV.USE_MOCK_DATA) return mockMarkAllRead()
  const res = await offlineMutate('POST', '/notifications/read-all')
  return unwrap<{ markedCount: number }>(res.data)
}

/** `DELETE /api/notifications/:id` — 204 No Content. Queues offline. */
export async function deleteNotification(id: number): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockDeleteNotification(id)
  await offlineMutate('DELETE', `/notifications/${id}`)
}
