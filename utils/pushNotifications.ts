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
import { type NotificationType } from './notificationSounds'
import { notificationDisplay } from './notificationDisplay'

let notifee: typeof import('@notifee/react-native').default | null = null
let EventType: typeof import('@notifee/react-native').EventType | null = null
let AndroidImportance: typeof import('@notifee/react-native').AndroidImportance | null = null

function getNotifee() {
  if (notifee === null) {
    try {
      notifee = require('@notifee/react-native').default
      EventType = require('@notifee/react-native').EventType
      AndroidImportance = require('@notifee/react-native').AndroidImportance
    } catch (error) {
      // Notifee requires native modules — not available in Expo Go. Silently skip.
      return null
    }
  }
  return notifee
}

export const FCM_TOKEN_STORAGE_KEY = '@goconnect/fcm_token'

/** Must match the sound file bundled by plugins/withNotificationSound.js (assets/sound/notification_sounbd.wav). */
const NOTIFICATION_SOUND = 'notification_sounbd'
const NOTIFICATION_CHANNEL_ID = 'default'

const RNFB_APP_TURBO_MODULE = 'NativeRNFBTurboApp'

export type NotificationPayload = {
  id?: string | number
  type?: string
  action_type?: string
  action_id?: string
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
  } catch (error) {
    console.debug('⚠️ TurboModuleRegistry check failed:', error instanceof Error ? error.message : error)
  }

  try {
    const modules = NativeModules as Record<string, unknown>
    nativeFirebaseAvailable = !!(
      modules[RNFB_APP_TURBO_MODULE] ||
      modules.RNFBAppModule ||
      modules.RNFBMessagingModule
    )
  } catch (error) {
    console.debug('⚠️ NativeModules check failed:', error instanceof Error ? error.message : error)
    nativeFirebaseAvailable = false
  }

  if (!nativeFirebaseAvailable) {
    console.warn(
      '⚠️ Native Firebase not linked — push disabled. Rebuild with `npx expo run:ios` / `run:android` (Expo Go is not enough).',
    )
  }

  return nativeFirebaseAvailable
}

function normalizeMessagingModule(raw: unknown): MessagingModule | null {
  if (!raw) return null
  const mod = raw as MessagingModule & { default?: MessagingModule }
  if (typeof mod === 'function') return mod as MessagingModule
  if (mod.default && typeof mod.default === 'function') return mod.default as MessagingModule
  if (typeof (mod as any)?.getMessaging === 'function') return mod
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
    if (typeof mod === 'function') {
      (mod as any)() // Verify it can be called
    } else if (typeof (mod as any).getMessaging === 'function') {
      (mod as any).getMessaging()
    }
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

  const type = (data.action_type??data.type) as NotificationType | undefined

  // Extract ID from various sources
  const id = asId(data.action_id ?? data.id ?? data.visitId ?? data.visit_id)
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

/**
 * Creates (or updates, on Android) the notification channel carrying the
 * custom sound bundled by plugins/withNotificationSound.js. No-op on iOS,
 * where the sound is set per-notification instead.
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return
  const n = getNotifee()
  if (!n) return
  try {
    await n.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Default',
      importance: AndroidImportance?.HIGH || 5,
      sound: NOTIFICATION_SOUND,
    })
  } catch (error) {
    console.warn('⚠️ Failed to create notifee notification channel:', error)
  }
}

/**
 * Displays a real OS notification (Android shade / iOS Notification Center)
 * for an FCM message, with the custom sound. Called from both the foreground
 * (`onMessage`) and background/quit (`setBackgroundMessageHandler`) paths so
 * behaviour is identical no matter the app's state.
 */
export async function displayFcmNotification(message: RemoteMessage | null | undefined): Promise<void> {
  if (!message) return

  const n = getNotifee()
  if (!n) return

  const payload = extractPayload(message)
  const title = message.notification?.title || (payload.title as string) || 'Notification'
  const body = message.notification?.body || (payload.body as string) || 'You have a new notification'

  try {
    await n.displayNotification({
      title,
      body,
      data: message.data as Record<string, string | number | object>,
      android: {
        channelId: NOTIFICATION_CHANNEL_ID,
        smallIcon: 'notification_icon',
        sound: NOTIFICATION_SOUND,
        pressAction: { id: 'default' },
      },
      ios: {
        sound: `${NOTIFICATION_SOUND}.wav`,
        foregroundPresentationOptions: { alert: true, sound: true, badge: false },
      },
    })
  } catch (error) {
    console.warn('⚠️ Failed to display notifee notification:', error)
  }
}

async function handleForegroundMessage(message: RemoteMessage | null | undefined): Promise<void> {
  if (!message) return

  const payload = extractPayload(message)
  const type = payload.type as NotificationType | undefined
  const title = message.notification?.title || 'Notification'
  const body = message.notification?.body || 'You have a new notification'

  notificationLogger.addLog({
    type: 'received',
    title,
    body,
    data: message.data as Record<string, unknown>,
  })

  // System notification (tray/Notification Center) with custom sound.
  await displayFcmNotification(message)

  // In-app banner while the app is open.
  notificationDisplay.show(title, body, type, payload)
}

/**
 * Must run once at app startup.
 * No-ops when native Firebase is not linked (Expo Go / stale binary).
 *
 * The FCM background message handler itself must be registered at true
 * top-level (see index.js) rather than here — RNFB requires it be set up
 * before the app's component tree mounts for reliable background delivery.
 */
export function configureNotificationHandler(): void {
  void ensureNotificationChannel()
}

/**
 * Foreground receive/tap + background/quit tap navigation.
 * Call once from the root layout useEffect.
 */
export function registerNotificationListeners(): () => void {
  const fb = getMessagingModule()
  const unsubscribers: Array<() => void> = []

  const n = getNotifee()
  if (n && EventType) {
    unsubscribers.push(
      n.onForegroundEvent(({ type, detail }) => {
        if (type === EventType!.PRESS) {
          console.log('👆 Notifee foreground press')
          navigateFromNotificationPayload((detail.notification?.data ?? {}) as NotificationPayload)
        }
      }),
    )

    void n
      .getInitialNotification()
      .then((initial) => {
        if (!initial) return
        console.log('👆 Opened from notifee quit-state notification')
        setTimeout(
          () => navigateFromNotificationPayload((initial.notification.data ?? {}) as NotificationPayload),
          400,
        )
      })
      .catch((error) => {
        console.warn('⚠️ notifee getInitialNotification failed:', error)
      })
  }

  if (!fb) return () => {
    for (const unsub of unsubscribers) unsub()
  }

  try {
    const fbAny = fb as any
    const messaging = typeof fbAny === 'function' ? fbAny() : fbAny.getMessaging?.()

    if (!messaging) {
      console.warn('⚠️ Could not initialize Firebase messaging')
      return () => {
        for (const unsub of unsubscribers) unsub()
      }
    }

    unsubscribers.push(
      messaging.onMessage(async (message: any) => {
        console.log('📩 Foreground FCM message:', {
          messageId: message.messageId,
          title: message.notification?.title,
          body: message.notification?.body,
          data: message.data,
        })
        await handleForegroundMessage(message as RemoteMessage)
      }),
    )

    // Fallback: only fires if FCM itself ever auto-displays a notification
    // (e.g. a payload with a top-level `notification` block). Harmless to
    // keep alongside the notifee-driven paths above.
    unsubscribers.push(
      messaging.onNotificationOpenedApp((message: any) => {
        console.log('👆 Opened from background notification')
        handleOpenedMessage(message as RemoteMessage)
      }),
    )

    unsubscribers.push(
      messaging.onTokenRefresh(async (token: string) => {
        console.log('🔄 FCM token refreshed')
        try {
          await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
        } catch (error) {
          console.warn('⚠️ Failed to persist refreshed FCM token:', error)
        }
      }),
    )

    void messaging
      .getInitialNotification()
      .then((message: any) => {
        if (!message) return
        console.log('👆 Opened from quit-state notification')
        setTimeout(() => handleOpenedMessage(message as RemoteMessage), 400)
      })
      .catch((error: any) => {
        console.warn('⚠️ getInitialNotification failed:', error)
      })

    console.log('✅ FCM notification listeners registered')
  } catch (error) {
    console.warn('⚠️ Failed to register FCM listeners:', error)
  }

  return () => {
    for (const unsub of unsubscribers) unsub()
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
    const fbAny = fb as any
    const messaging = typeof fbAny === 'function' ? fbAny() : fbAny.getMessaging?.()

    if (!messaging) {
      console.warn('⚠️ Could not initialize Firebase messaging')
      return null
    }

    const { AuthorizationStatus } = fbAny

    const androidOk = await ensureAndroidPostNotificationsPermission()
    if (!androidOk) {
      console.warn('⚠️ Android POST_NOTIFICATIONS denied')
      return null
    }

    let status = await messaging.hasPermission()
    if (
      status === AuthorizationStatus.DENIED ||
      status === AuthorizationStatus.NOT_DETERMINED
    ) {
      status = await messaging.requestPermission()
    }

    const allowed =
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL ||
      status === AuthorizationStatus.EPHEMERAL

    if (!allowed) {
      console.warn('⚠️ Notification permission denied')
      return null
    }

    await messaging.registerDeviceForRemoteMessages()
    const token = await messaging.getToken()

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
      const fbAny = fb as any
      const messaging = typeof fbAny === 'function' ? fbAny() : fbAny.getMessaging?.()
      if (messaging) {
        await messaging.deleteToken()
        console.log('🔄 FCM token deleted, requesting new token...')
      }
    } catch (error) {
      console.warn(
        '⚠️ Could not delete FCM token before refresh:',
        error instanceof Error ? error.message : error,
      )
    }
  }

  return requestAndSavePushToken()
}
