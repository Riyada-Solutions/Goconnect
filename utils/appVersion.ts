import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * The app's version, read from the embedded Expo manifest (`app.json` →
 * `expo.version`) rather than hardcoded in a translation string, so the number
 * users see always matches the binary they installed.
 */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '—'

/**
 * Platform build number — Android `versionCode` / iOS `buildNumber`. Only set
 * when declared in the Expo config; a bare `expo prebuild` project that keeps
 * the number in `build.gradle` leaves this null, and callers hide the label.
 */
export const APP_BUILD: string | null = (() => {
  const config = Constants.expoConfig
  const raw = Platform.OS === 'android'
    ? config?.android?.versionCode
    : config?.ios?.buildNumber
  return raw == null ? null : String(raw)
})()

/** `"1.0.8"`, or `"1.0.8 (12)"` when the build number is known. */
export const APP_VERSION_LONG: string =
  APP_BUILD ? `${APP_VERSION} (${APP_BUILD})` : APP_VERSION
