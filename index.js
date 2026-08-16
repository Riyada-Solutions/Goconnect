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
      fbModule().setBackgroundMessageHandler(async (message) => {
        await displayFcmNotification(message)
      })
    }
  } catch (error) {
    console.warn('⚠️ Firebase messaging not available:', error instanceof Error ? error.message : error)
  }
}

require('expo-router/entry')
