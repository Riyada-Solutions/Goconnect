import { useCallback } from 'react'
import type { NotificationType } from './notificationSounds'

export interface NotificationAlert {
  id: string
  title: string
  body: string
  type?: NotificationType
  payload?: Record<string, unknown>
  timestamp: number
}

type NotificationListener = (notification: NotificationAlert) => void

let listeners: NotificationListener[] = []
let notificationId = 0

/**
 * Global notification display manager
 * Shows notifications as banner alerts rather than dialog boxes
 */
export const notificationDisplay = {
  subscribe: (listener: NotificationListener) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },

  show: (title: string, body: string, type?: NotificationType, payload?: Record<string, unknown>) => {
    const notification: NotificationAlert = {
      id: `notif_${++notificationId}`,
      title,
      body,
      type,
      payload,
      timestamp: Date.now(),
    }
    listeners.forEach((listener) => listener(notification))
  },

  clear: () => {
    listeners = []
  },
}

export const useNotificationDisplay = () => {
  const showNotification = useCallback(
    (title: string, body: string, type?: NotificationType, payload?: Record<string, unknown>) => {
      notificationDisplay.show(title, body, type, payload)
    },
    [],
  )

  return { showNotification }
}
