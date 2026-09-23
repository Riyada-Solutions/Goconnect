// Registers the FCM background message handler at true top level, before the
// app's component tree mounts. RNFB requires this for reliable background/quit
// delivery. Notifee is lazy-loaded in utils/pushNotifications.ts to avoid
// requiring native modules when not available (Expo Go).

const {
  displayFcmNotification,
  isNativeFirebaseAvailable,
} = require('./utils/pushNotifications')

if (isNativeFirebaseAvailable()) {
  try {
    const raw = require('@react-native-firebase/messaging')
    const fbModule = typeof raw === 'function' ? raw : raw.default

    if (typeof fbModule === 'function') {
      const messaging = fbModule()
      if (messaging && typeof messaging.setBackgroundMessageHandler === 'function') {
        messaging.setBackgroundMessageHandler(async (message) => {
          try {
            await displayFcmNotification(message)
          } catch (err) {
            console.warn('⚠️ Failed to display FCM notification:', err instanceof Error ? err.message : err)
          }
        })
      }
    } else if (fbModule && typeof fbModule.setBackgroundMessageHandler === 'function') {
      fbModule.setBackgroundMessageHandler(async (message) => {
        try {
          await displayFcmNotification(message)
        } catch (err) {
          console.warn('⚠️ Failed to display FCM notification:', err instanceof Error ? err.message : err)
        }
      })
    }
  } catch (error) {
    console.warn('⚠️ Firebase messaging setup failed:', error instanceof Error ? error.message : error)
  }
}

require('expo-router/entry')
