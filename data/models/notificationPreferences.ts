/** Server-side notification toggle preferences (`GET/PATCH /me/notification-preferences`). */
export interface NotificationPreferences {
  pushNotifications: boolean
  messages: boolean
  visitAlerts: boolean
  reminders: boolean
  appUpdates: boolean
}

export type NotificationPreferenceKey = keyof NotificationPreferences

export type NotificationPreferencesPatch = Partial<NotificationPreferences>
