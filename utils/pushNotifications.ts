import AsyncStorage from '@react-native-async-storage/async-storage'
import { getMessaging, getToken as getFcmToken, registerDeviceForRemoteMessages } from '@react-native-firebase/messaging'
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

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as NotificationPayload
  console.log('👆 Notification tapped:', {
    title: response.notification.request.content.title,
    body: response.notification.request.content.body,
    data,
  })

  if (data.visitId) {
    router.push({ pathname: '/visits/[id]', params: { id: data.visitId } })
  } else if (data.patientId) {
    router.push({ pathname: '/patients/[id]', params: { id: data.patientId } })
  } else if (data.type === 'notifications') {
    router.push('/notifications')
  }
}

export function registerNotificationListeners(): () => void {
  try {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    )
    console.log('✅ Expo Notifications listener registered')
    return () => responseSubscription.remove()
  } catch (error) {
    console.warn('⚠️ Failed to register notifications listener:', error)
    return () => {}
  }
}

/**
 * Request permission and fetch an FCM registration token (native FCM token
 * on Android; on iOS, native Firebase Messaging exchanges the APNs device
 * token for an FCM token). Saves the token to AsyncStorage so subsequent
 * calls can read it without re-requesting permission.
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

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permission denied')
      return null
    }

    let token: string
    if (Platform.OS === 'ios') {
      // expo-notifications' getDevicePushTokenAsync() only returns the raw
      // APNs device token on iOS, not an FCM token — the backend expects a
      // real FCM registration token. Native Firebase Messaging registers
      // that APNs token with FCM and hands back the matching FCM token.
      const messagingInstance = getMessaging()
      await registerDeviceForRemoteMessages(messagingInstance)
      token = await getFcmToken(messagingInstance)
    } else {
      // getDevicePushTokenAsync returns the raw FCM token on Android —
      // exactly what the backend expects.
      const result = await Notifications.getDevicePushTokenAsync()
      token = result.data as string
    }

    await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
    return token
  } catch (error) {
    console.error('❌ Error getting push token:', error)
    return null
  }
}
