import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import {
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
  TurboModuleRegistry,
} from 'react-native'
import { notificationLogger } from './notificationLogger'
import { playNotificationSound, type NotificationType } from './notificationSounds'
import { notificationDisplay } from './notificationDisplay'

export const FCM_TOKEN_STORAGE_KEY = '@goconnect/fcm_token'

const RNFB_APP_TURBO_MODULE = 'NativeRNFBTurboApp'

export type NotificationPayload = {
  id?: string | number
  type?: string
  priority?: string
  deeplink?: string | { screen?: string; params?: Record<string, unknown>; url?: string }
  metadata?: string | Record<string, unknown>
  visitId?: string | number
  visit_id?: string | number
  patientId?: string | number
  patient_id?: string | number
  [key: string]: unknown
}

type Deeplink = {
  screen?: string
  params?: Record<string, unknown>
  url?: string
}

type RemoteMessage = {
  messageId?: string
  data?: Record<string, unknown>
  notification?: { title?: string; body?: string }
}

type MessagingModule = typeof import('@react-native-firebase/messaging')

let messagingModule: MessagingModule | null | undefined
let nativeFirebaseChecked = false
let nativeFirebaseAvailable = false

/**
 * Probe for the RN Firebase App turbo module WITHOUT requiring the JS package.
 * Requiring `@react-native-firebase/*` when NativeRNFBTurboApp is missing throws
 * via TurboModuleRegistry.getEnforcing and LogBox still surfaces it as ERROR.
 */
export function isNativeFirebaseAvailable(): boolean {
  if (nativeFirebaseChecked) return nativeFirebaseAvailable
  nativeFirebaseChecked = true

  if (Platform.OS === 'web') {
    nativeFirebaseAvailable = false
    return false
  }

  try {
    const turbo = TurboModuleRegistry.get?.(RNFB_APP_TURBO_MODULE)
    if (turbo) {
      nativeFirebaseAvailable = true
      return true
    }
  } catch {
    // ignore
  }

  const modules = NativeModules as Record<string, unknown>
  nativeFirebaseAvailable = !!(
    modules[RNFB_APP_TURBO_MODULE] ||
    modules.RNFBAppModule ||
    modules.RNFBMessagingModule
  )

  if (!nativeFirebaseAvailable) {
    console.warn(
      '⚠️ Native Firebase not linked — push disabled. Rebuild with `npx expo run:ios` / `run:android` (Expo Go is not enough).',
    )
  }

  return nativeFirebaseAvailable
}

function normalizeMessagingModule(raw: unknown): MessagingModule | null {
  if (!raw || typeof raw !== 'object') return null
  const mod = raw as MessagingModule & { default?: MessagingModule }
  if (typeof mod.getMessaging === 'function') return mod
  if (mod.default && typeof mod.default.getMessaging === 'function') return mod.default
  return null
}

/**
 * Lazy-load RN Firebase Messaging only after the native turbo module is present.
 */
function getMessagingModule(): MessagingModule | null {
  if (messagingModule !== undefined) return messagingModule
  if (!isNativeFirebaseAvailable()) {
    messagingModule = null
    return null
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require('@react-native-firebase/messaging')
    const mod = normalizeMessagingModule(raw)
    if (!mod) {
      messagingModule = null
      return null
    }
    mod.getMessaging()
    messagingModule = mod
    return messagingModule
  } catch (error) {
    console.warn(
      '⚠️ Firebase Messaging unavailable:',
      error instanceof Error ? error.message : error,
    )
    messagingModule = null
    return null
  }
}

function parseJsonField<T>(value: unknown): T | null {
  if (value == null) return null
  if (typeof value === 'object') return value as T
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function asId(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  return String(value)
}

function extractPayload(message: RemoteMessage | null | undefined): NotificationPayload {
  return (message?.data ?? {}) as NotificationPayload
}

function resolveDeeplink(data: NotificationPayload): Deeplink | null {
  const parsed = parseJsonField<Deeplink>(data.deeplink)
  if (parsed?.screen || parsed?.url) return parsed

  const type = data.type as NotificationType | undefined

  // Extract ID from various sources
  const id = asId(data.id ?? data.visitId ?? data.visit_id)
  const visitId = asId(data.visitId ?? data.visit_id)
  const patientId = asId(data.patientId ?? data.patient_id)

  // Route based on notification type
  switch (type) {
    case 'appointment':
    case 'appointment_rescheduled':
      if (id) return { screen: 'appointment_detail', params: { id } }
      return { screen: 'appointments_list' }

    case 'lab_result':
    case 'lab_order':
      if (patientId) return { screen: 'lab_results', params: { patientId } }
      return { screen: 'patients_list' }

    case 'medication':
    case 'dialysis_order':
    case 'holiday_treatment':
      if (patientId) return { screen: 'patient_detail', params: { id: patientId } }
      return { screen: 'patients_list' }

    case 'emergency_referral':
    case 'incident':
    case 'isolation':
      if (visitId) return { screen: 'visit_detail', params: { id: visitId } }
      return { screen: 'visits_list' }

    case 'vaccine_overdue':
    case 'vaccine_due_soon':
      if (patientId) return { screen: 'patient_detail', params: { id: patientId, tab: 'vaccinations' } }
      return { screen: 'patients_list' }

    case 'patient_document_reminder':
    case 'employee_document_reminder':
      if (patientId) return { screen: 'patient_detail', params: { id: patientId, tab: 'documents' } }
      return { screen: 'patients_list' }

    case 'task':
      // Task routing — if available
      if (id) return { screen: 'task_detail', params: { id } }
      return { screen: 'home' }
  }

  // Fallback logic for backward compatibility
  if (visitId) return { screen: 'visit_detail', params: { id: visitId } }
  if (patientId) return { screen: 'patient_detail', params: { id: patientId } }

  const metadata = parseJsonField<Record<string, unknown>>(data.metadata)
  const metaVisitId = asId(metadata?.visit_id ?? metadata?.visitId)
  if (metaVisitId) return { screen: 'visit_detail', params: { id: metaVisitId } }

  const metaPatientId = asId(metadata?.patient_id ?? metadata?.patientId)
  if (metaPatientId) return { screen: 'patient_detail', params: { id: metaPatientId } }

  return null
}

/**
 * Navigate from a push payload using the backend deeplink contract
 * (see docs/Backend API - Notifications.md §5), with flat-field fallbacks.
 */
export function navigateFromNotificationPayload(data: NotificationPayload): void {
  const deeplink = resolveDeeplink(data)

  console.log('👆 Notification navigation:', {
    type: data.type,
    deeplink,
    raw: data,
  })

  if (!deeplink) {
    router.push('/notifications')
    return
  }

  if (deeplink.url) {
    void Linking.openURL(String(deeplink.url)).catch((error) => {
      console.warn('⚠️ Failed to open notification URL:', error)
      router.push('/notifications')
    })
    return
  }

  const screen = deeplink.screen
  const params = deeplink.params ?? {}
  const id = asId(params.id)
  const patientId = asId(params.patient_id ?? params.patientId)

  switch (screen) {
    case 'home':
      router.push('/(tabs)/home')
      break
    case 'visits_list':
      router.push('/(tabs)/visits')
      break
    case 'visit_detail':
      if (id) router.push({ pathname: '/visits/[id]', params: { id } })
      else router.push('/(tabs)/visits')
      break
    case 'appointments_list':
    case 'schedule':
      router.push('/(tabs)/scheduler')
      break
    case 'appointment_detail':
      if (id) router.push({ pathname: '/appointments/[id]', params: { id } })
      else router.push('/(tabs)/scheduler')
      break
    case 'patients_list':
      router.push('/(tabs)/patients')
      break
    case 'patient_detail':
      if (id) router.push({ pathname: '/patients/[id]', params: { id } })
      else router.push('/(tabs)/patients')
      break
    case 'patient_inventory':
      if (patientId) {
        router.push({
          pathname: '/patients/[id]',
          params: { id: patientId, tab: 'inventory' },
        })
      } else {
        router.push('/(tabs)/patients')
      }
      break
    case 'lab_results':
      if (patientId) {
        router.push({ pathname: '/lab-results/[patientId]', params: { patientId } })
      } else {
        router.push('/notifications')
      }
      break
    case 'settings':
      router.push('/(settings)')
      break
    case 'notifications':
      router.push('/notifications')
      break
    case 'message_thread':
      router.push('/notifications')
      break
    default:
      router.push('/notifications')
      break
  }
}

function handleOpenedMessage(message: RemoteMessage | null | undefined): void {
  if (!message) return
  notificationLogger.addLog({
    type: 'tapped',
    title: message.notification?.title,
    body: message.notification?.body,
    data: message.data as Record<string, unknown>,
  })
  navigateFromNotificationPayload(extractPayload(message))
}

async function handleForegroundMessage(message: RemoteMessage | null | undefined): Promise<void> {
  if (!message) return

  const payload = extractPayload(message)
  const type = payload.type as NotificationType | undefined
  const title = message.notification?.title || 'Notification'
  const body = message.notification?.body || 'You have a new notification'

  // Play notification sound
  if (type) {
    await playNotificationSound(type)
  }

  notificationLogger.addLog({
    type: 'received',
    title,
    body,
    data: message.data as Record<string, unknown>,
  })

  // Show visual notification banner when app is open
  notificationDisplay.show(title, body, type, payload)
}

/**
 * Must run once at app startup.
 * No-ops when native Firebase is not linked (Expo Go / stale binary).
 */
export function configureNotificationHandler(): void {
  const fb = getMessagingModule()
  if (!fb) return

  try {
    const messaging = fb.getMessaging()
    fb.setBackgroundMessageHandler(messaging, async (message) => {
      console.log('📩 Background FCM message:', {
        messageId: message.messageId,
        data: message.data,
        notification: message.notification,
      })
    })
    console.log('✅ FCM background handler registered')
  } catch (error) {
    console.warn('⚠️ Failed to register FCM background handler:', error)
  }
}

/**
 * Foreground receive + background/quit tap navigation.
 * Call once from the root layout useEffect.
 */
export function registerNotificationListeners(): () => void {
  const fb = getMessagingModule()
  if (!fb) return () => {}

  try {
    const messaging = fb.getMessaging()
    const unsubscribers: Array<() => void> = []

    unsubscribers.push(
      fb.onMessage(messaging, async (message) => {
        console.log('📩 Foreground FCM message:', {
          messageId: message.messageId,
          title: message.notification?.title,
          body: message.notification?.body,
          data: message.data,
        })
        await handleForegroundMessage(message as RemoteMessage)
      }),
    )

    unsubscribers.push(
      fb.onNotificationOpenedApp(messaging, (message) => {
        console.log('👆 Opened from background notification')
        handleOpenedMessage(message as RemoteMessage)
      }),
    )

    unsubscribers.push(
      fb.onTokenRefresh(messaging, async (token) => {
        console.log('🔄 FCM token refreshed')
        try {
          await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
        } catch (error) {
          console.warn('⚠️ Failed to persist refreshed FCM token:', error)
        }
      }),
    )

    void fb
      .getInitialNotification(messaging)
      .then((message) => {
        if (!message) return
        console.log('👆 Opened from quit-state notification')
        setTimeout(() => handleOpenedMessage(message as RemoteMessage), 400)
      })
      .catch((error) => {
        console.warn('⚠️ getInitialNotification failed:', error)
      })

    console.log('✅ FCM notification listeners registered')
    return () => {
      for (const unsub of unsubscribers) unsub()
    }
  } catch (error) {
    console.warn('⚠️ Failed to register FCM listeners:', error)
    return () => {}
  }
}

async function ensureAndroidPostNotificationsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true
  if (typeof Platform.Version === 'number' && Platform.Version < 33) return true

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  )
  return result === PermissionsAndroid.RESULTS.GRANTED
}

/**
 * Request permission and fetch a native FCM registration token.
 * Returns null when native Firebase is unavailable or permission is denied.
 */
export async function requestAndSavePushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null

  const fb = getMessagingModule()
  if (!fb) return null

  try {
    const messaging = fb.getMessaging()
    const { AuthorizationStatus } = fb

    const androidOk = await ensureAndroidPostNotificationsPermission()
    if (!androidOk) {
      console.warn('⚠️ Android POST_NOTIFICATIONS denied')
      return null
    }

    let status = await fb.hasPermission(messaging)
    if (
      status === AuthorizationStatus.DENIED ||
      status === AuthorizationStatus.NOT_DETERMINED
    ) {
      status = await fb.requestPermission(messaging)
    }

    const allowed =
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL ||
      status === AuthorizationStatus.EPHEMERAL

    if (!allowed) {
      console.warn('⚠️ Notification permission denied')
      return null
    }

    await fb.registerDeviceForRemoteMessages(messaging)
    const token = await fb.getToken(messaging)

    await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
    console.log('✅ FCM token saved')
    notificationLogger.addLog({
      type: 'token',
      message: `Token received: ${token.substring(0, 20)}...`,
    })
    return token
  } catch (error) {
    console.error('❌ Error getting FCM token:', error)
    notificationLogger.addLog({
      type: 'error',
      message: `Failed to get token: ${error instanceof Error ? error.message : String(error)}`,
    })
    return null
  }
}

/** Clear stored token + ask FCM for a fresh one (dev tools). */
export async function refreshPushToken(): Promise<string | null> {
  await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY)

  const fb = getMessagingModule()
  if (fb) {
    try {
      await fb.deleteToken(fb.getMessaging())
      console.log('🔄 FCM token deleted, requesting new token...')
    } catch (error) {
      console.warn(
        '⚠️ Could not delete FCM token before refresh:',
        error instanceof Error ? error.message : error,
      )
    }
  }

  return requestAndSavePushToken()
}
