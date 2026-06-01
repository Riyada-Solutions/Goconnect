import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { NotificationPreferencesPatch } from '@/data/models/notificationPreferences'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/data/settings_repository'

export const NOTIFICATION_PREFERENCES_QUERY_KEY = [
  'me',
  'notification-preferences',
] as const

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: getNotificationPreferences,
    staleTime: 60_000,
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: NotificationPreferencesPatch) =>
      updateNotificationPreferences(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, data)
    },
  })
}
