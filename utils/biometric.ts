import Constants from 'expo-constants'
import { Platform } from 'react-native'

/** True when running inside the Expo Go app from the App Store. */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient'
}

/** Face ID on iOS requires a custom dev or production build — not Expo Go. */
export function isFaceIdSupportedInCurrentBuild(): boolean {
  if (Platform.OS === 'web') return false
  if (Platform.OS === 'ios' && isExpoGo()) return false
  return true
}

export function getBiometricErrorMessage(
  error: string | undefined,
  t: (key: string) => string,
): string {
  if (error === 'missing_usage_description') {
    return isExpoGo() ? t('biometricExpoGoUnsupported') : t('biometricRebuildRequired')
  }
  if (error === 'not_enrolled') return t('biometricNotEnrolled')
  if (error === 'not_available') return t('biometricNoHardware')
  if (error === 'user_cancel' || error === 'system_cancel') return t('biometricCancelled')
  if (error) return `${t('biometricFailed')} (${error})`
  return t('biometricFailed')
}
