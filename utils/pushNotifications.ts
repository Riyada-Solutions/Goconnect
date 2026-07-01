import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export const FCM_TOKEN_STORAGE_KEY = '@goconnect/fcm_token'

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
