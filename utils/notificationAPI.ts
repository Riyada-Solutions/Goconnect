import AsyncStorage from '@react-native-async-storage/async-storage'
import { getWebBaseUrl } from '@/data/upload_config'
import { ACCESS_TOKEN_KEY } from '@/data/auth_repository'
import type { NotificationType } from './notificationSounds'

export interface NotificationTypesResponse {
  data: NotificationType[]
  status: string
  message: string
}

export interface SendTestNotificationRequest {
  token: string
  title: string
  body: string
  type: NotificationType
  id: number | string
}

export interface SendTestNotificationResponse {
  data: {
    success: boolean
    response?: { name?: string }
    [key: string]: any
  }
  status: string
  message: string
}

/**
 * Get the notification API base URL (same domain as webview)
 * e.g., https://staging.careconnectksa.com/api
 */
function getNotificationApiUrl(): string {
  const webDomain = getWebBaseUrl()
  return `${webDomain}/api`
}

export async function fetchNotificationTypes(): Promise<NotificationType[]> {
  try {
    const apiUrl = getNotificationApiUrl()
    const url = `${apiUrl}/notification/types`

    console.log(`🔔 Fetching notification types from: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch notification types: ${response.statusText}`)
    }

    const data: NotificationTypesResponse = await response.json()
    console.log(`✅ Got ${data.data?.length || 0} notification types`)
    return data.data || []
  } catch (error) {
    console.error('❌ Error fetching notification types:', error)
    throw error
  }
}

export async function sendTestNotification(
  request: SendTestNotificationRequest,
): Promise<SendTestNotificationResponse> {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
    const apiUrl = getNotificationApiUrl()
    const url = `${apiUrl}/notification/test`

    console.log(`📤 Sending test notification to: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to send test notification: ${response.statusText}`)
    }

    const data: SendTestNotificationResponse = await response.json()
    console.log(`✅ Test notification sent successfully`)
    return data
  } catch (error) {
    console.error('❌ Error sending test notification:', error)
    throw error
  }
}
