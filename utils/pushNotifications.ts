import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { router } from 'expo-router'

export const FCM_TOKEN_STORAGE_KEY = '@goconnect/fcm_token'

// Lazy load Firebase Messaging - only available after native build
let messaging: any = null
try {
  if (Platform.OS !== 'web') {
    messaging = require('@react-native-firebase/messaging').default
  }
} catch (error) {
  console.warn('⚠️ Firebase Messaging not available in this environment')
}

export type NotificationPayload = {
  visitId?: string | number
  patientId?: string | number
  type?: string
  [key: string]: any
}

/**
 * Call this once from the root layout useEffect to configure foreground
 * notification display. Must run after native modules are initialized.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

/**
 * Handle navigation when notification is received while app is in foreground.
 * Called when notification arrives and app is open.
 */
function handleNotificationReceived(notification: Notifications.Notification): void {
  const data = notification.request.content.data as NotificationPayload
  console.log('📲 Notification received (foreground):', {
    title: notification.request.content.title,
    body: notification.request.content.body,
    data,
  })
}

/**
 * Handle navigation when user taps on notification.
 * Called when user interacts with notification (tap, etc).
 */
function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as NotificationPayload
  console.log('👆 Notification tapped:', {
    title: response.notification.request.content.title,
    body: response.notification.request.content.body,
    data,
  })

  // Navigate based on notification data
  if (data.visitId) {
    router.push({ pathname: '/visits/[id]', params: { id: data.visitId } })
  } else if (data.patientId) {
    router.push({ pathname: '/patients/[id]', params: { id: data.patientId } })
  } else if (data.type === 'notifications') {
    router.push('/notifications')
  }
}

/**
 * Register notification listeners for handling received and tapped notifications.
 * Uses Firebase Messaging for foreground messages + Expo Notifications for response.
 * Call this once from the root layout after configureNotificationHandler().
 * Returns a cleanup function to unsubscribe.
 */
export function registerNotificationListeners(): () => void {
  const unsubscribers: Array<() => void> = []

  // Firebase Messaging: Handle foreground messages (if available)
  if (messaging) {
    try {
      const firebaseUnsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log('📲 Foreground notification received via Firebase:', {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        })

        // Show notification to user even in foreground
        if (remoteMessage.notification) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification.title || '',
              body: remoteMessage.notification.body || '',
              data: remoteMessage.data || {},
            },
            trigger: null,
          })
        }
      })
      unsubscribers.push(() => firebaseUnsubscribe())
      console.log('✅ Firebase Messaging listener registered')
    } catch (error) {
      console.warn('⚠️ Failed to register Firebase Messaging listener:', error)
    }
  }

  // Expo Notifications: Handle user tapping on notification
  try {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    )
    unsubscribers.push(() => responseSubscription.remove())
    console.log('✅ Expo Notifications response listener registered')
  } catch (error) {
    console.warn('⚠️ Failed to register Expo Notifications listener:', error)
  }

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

/**
 * Request permission and fetch the Firebase Cloud Messaging token.
 * On iOS: Returns FCM token (via Firebase Messaging)
 * On Android: Returns FCM token (via Firebase Messaging)
 * Saves token to AsyncStorage for later use.
 *
 * Returns the token string on success, null if permission is denied or the
 * device is a simulator.
 */
export async function requestAndSavePushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  if (!Device.isDevice) return null // simulators can't receive push notifications

  try {
    // Request notification permission
    const { status: current } = await Notifications.getPermissionsAsync()
    let finalStatus = current

    if (current !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permission denied')
      return null
    }

    // Try Firebase Messaging first (native), fall back to Expo if not available
    let token: string | null = null

    if (messaging) {
      try {
        token = await messaging().getToken()
        console.log('🔥 Firebase FCM Token:', token)
      } catch (fbError) {
        console.warn('⚠️ Firebase Messaging unavailable, using Expo token:', fbError)
        const result = await Notifications.getDevicePushTokenAsync()
        token = result.data as string
        console.log('📱 Expo Push Token:', token)
      }
    } else {
      // Firebase not available, use Expo token
      const result = await Notifications.getDevicePushTokenAsync()
      token = result.data as string
      console.log('📱 Expo Push Token:', token)
    }

    if (token) {
      await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
    }
    return token
  } catch (error) {
    console.error('❌ Error getting push token:', error)
    return null
  }
}
