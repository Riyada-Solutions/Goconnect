// Registers the FCM background message handler and notifee's background tap
// handler at true top level, before the app's component tree mounts. RNFB
// and notifee both require this for reliable background/quit delivery — see
// utils/pushNotifications.ts for the foreground/channel-setup counterparts.
//
// Metro compiles `require`/`import` to run in file order (not spec ES module
// hoisting), so the ordering below — handlers registered, THEN the app entry
// required — is guaranteed.
const {
  displayFcmNotification,
  isNativeFirebaseAvailable,
  navigateFromNotificationPayload,
} = require('./utils/pushNotifications')

if (isNativeFirebaseAvailable()) {
  try {
    const raw = require('@react-native-firebase/messaging')
    const fbModule = typeof raw === 'function' ? raw : raw.default

    if (typeof fbModule === 'function') {
      fbModule().setBackgroundMessageHandler(async (message) => {
        await displayFcmNotification(message)
      })
    }
  } catch (error) {
    console.warn('⚠️ Firebase messaging setup failed:', error instanceof Error ? error.message : error)
  }
}

try {
  const notifee = require('@notifee/react-native').default
  const { EventType } = require('@notifee/react-native')

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      navigateFromNotificationPayload(detail.notification?.data ?? {})
    }
  })
} catch (error) {
  console.warn('⚠️ Notifee not available - requires development build with native modules')
}

require('expo-router/entry')
