import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { router } from 'expo-router'

export const FCM_TOKEN_STORAGE_KEY = '@goconnect/fcm_token'

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
 * Call this once from the root layout after configureNotificationHandler().
 * Returns a cleanup function to unsubscribe.
 */
export function registerNotificationListeners(): () => void {
  // Handle notifications received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    handleNotificationReceived
  )

  // Handle user tapping on notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  )

  console.log('✅ Notification listeners registered')

  // Return cleanup function
  return () => {
    foregroundSubscription.remove()
    responseSubscription.remove()
  }
}

/**
 * Request permission and fetch the native device push token (FCM on Android,
 * APNs on iOS). Saves the token to AsyncStorage so subsequent calls can read
 * it without re-requesting permission.
 *
 * Returns the token string on success, null if permission is denied or the
 * device is a simulator.
 */
export async function requestAndSavePushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  if (!Device.isDevice) return null // simulators can't receive push notifications

  try {
    const { status: current } = await Notifications.getPermissionsAsync()
    let finalStatus = current

    if (current !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return null

    // getDevicePushTokenAsync returns the raw FCM token on Android and the
    // APNs device token on iOS — exactly what the backend expects.
    const result = await Notifications.getDevicePushTokenAsync()
    const token = result.data as string

    await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
    return token
  } catch {
    return null
  }
}
