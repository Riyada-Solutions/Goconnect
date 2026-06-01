import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

export const NOTIFICATIONS_QUERY_KEY = ['notifications', 'inbox'] as const
export const UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'] as const

// ─── List ──────────────────────────────────────────────────────────────────────
export function useNotifications(filter: 'all' | 'unread' = 'all') {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, filter],
    queryFn: () => fetchNotifications({ filter, per_page: 50, page: 1 }),
    staleTime: 30_000,
  })
}

// ─── Unread count ──────────────────────────────────────────────────────────────
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
  })
}

// ─── Helper: update cached list optimistically ─────────────────────────────────
function patchList(
  qc: ReturnType<typeof useQueryClient>,
  filter: 'all' | 'unread',
  patch: (items: ApiNotification[]) => ApiNotification[],
) {
  const key = [...NOTIFICATIONS_QUERY_KEY, filter]
  qc.setQueryData<NotificationListResponse>(key, (old) => {
    if (!old) return old
    return { ...old, data: patch(old.data) }
  })
}

// ─── Mark single as read ───────────────────────────────────────────────────────
export function useMarkNotificationRead(activeFilter: 'all' | 'unread' = 'all') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: (id) => {
      patchList(qc, activeFilter, (items) =>
        items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
      // also patch the "all" list if we're looking at "unread"
      if (activeFilter === 'unread') {
        patchList(qc, 'all', (items) =>
          items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        )
      }
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
      for (const filter of ['all', 'unread'] as const) {
        patchList(qc, filter, (items) => items.map((n) => ({ ...n, read: true })))
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
    },
  })
}

// ─── Delete a notification ─────────────────────────────────────────────────────
export function useDeleteNotification(activeFilter: 'all' | 'unread' = 'all') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onMutate: (id) => {
      for (const filter of ['all', 'unread'] as const) {
        patchList(qc, filter, (items) => items.filter((n) => n.id !== id))
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY })
    },
  })
}
