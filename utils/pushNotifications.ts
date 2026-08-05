import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { router } from 'expo-router'

export const FCM_TOKEN_STORAGE_KEY = '@goconnect/fcm_token'

export type NotificationPayload = {
  visitId?: string | number
  patientId?: string | number
  type?: string
  [key: string]: any
}

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

export async function requestAndSavePushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  if (!Device.isDevice) return null

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

    // Get Expo Push Token for Expo Notifications
    const projectId = Constants.expoConfig?.extra?.eas?.projectId

    if (!projectId) {
      console.warn('⚠️ EAS projectId not found in app.json')
      return null
    }

    const result = await Notifications.getExpoPushTokenAsync({ projectId })
    const token = result.data as string
    console.log('📱 Expo Push Token:', token)

    if (token) {
      await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
    }
    return token
  } catch (error) {
    console.error('❌ Error getting push token:', error)
    return null
  }
}
