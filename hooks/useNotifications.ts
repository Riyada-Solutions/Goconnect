import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/data/notification_repository'
import type {
  ApiNotification,
  NotificationListResponse,
} from '@/data/models/notification'
import { useOfflineQuery } from './useOfflineQuery'

export const NOTIFICATIONS_QUERY_KEY = ['notifications', 'inbox'] as const
export const UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'] as const

// ─── List ──────────────────────────────────────────────────────────────────────
/** The screen has a single list — always `filter=all`. Read/unread is shown
 *  per row from the `read` flag rather than by refetching a filtered list. */
export function useNotifications() {
  return useOfflineQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => fetchNotifications({ filter: 'all', per_page: 50, page: 1 }),
    cacheTtl: 30_000,
  })
}

// ─── Unread count ──────────────────────────────────────────────────────────────
export function useUnreadCount() {
  return useOfflineQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: fetchUnreadCount,
    cacheTtl: 30_000,
  })
}

// ─── Helper: update cached list optimistically ─────────────────────────────────
function patchList(
  qc: ReturnType<typeof useQueryClient>,
  patch: (items: ApiNotification[]) => ApiNotification[],
) {
  qc.setQueryData<NotificationListResponse>(NOTIFICATIONS_QUERY_KEY, (old) => {
    if (!old) return old
    return { ...old, data: patch(old.data) }
  })
}

// ─── Mark single as read ───────────────────────────────────────────────────────
export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: (id) => {
      patchList(qc, (items) =>
        items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
    },
  })
}

// ─── Mark all as read ──────────────────────────────────────────────────────────
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: () => {
      patchList(qc, (items) => items.map((n) => ({ ...n, read: true })))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
    },
  })
}

// ─── Delete a notification ─────────────────────────────────────────────────────
export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onMutate: (id) => {
      patchList(qc, (items) => items.filter((n) => n.id !== id))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
    },
  })
}
