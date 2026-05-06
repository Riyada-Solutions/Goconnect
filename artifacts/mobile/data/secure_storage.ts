import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export const FACE_TOKEN_KEY = 'face_token'

const useSecureStore = Platform.OS !== 'web'

export async function getFaceToken(): Promise<string | null> {
  try {
    if (useSecureStore) return await SecureStore.getItemAsync(FACE_TOKEN_KEY)
    return await AsyncStorage.getItem(FACE_TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setFaceToken(token: string): Promise<void> {
  try {
    if (useSecureStore) {
      await SecureStore.setItemAsync(FACE_TOKEN_KEY, token)
    } else {
      await AsyncStorage.setItem(FACE_TOKEN_KEY, token)
    }
  } catch {}
}

export async function clearFaceToken(): Promise<void> {
  try {
    if (useSecureStore) {
      await SecureStore.deleteItemAsync(FACE_TOKEN_KEY)
    } else {
      await AsyncStorage.removeItem(FACE_TOKEN_KEY)
    }
  } catch {}
}
