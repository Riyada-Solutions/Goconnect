import AsyncStorage from '@react-native-async-storage/async-storage'

import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { isEffectivelyOnline } from '@/context/NetworkContext'
import { offlineMutate } from './offline_api'
import {
  mockLogin,
  mockGetMe,
  mockRegister,
  mockSendOtp,
  mockVerifyOtp,
  mockResetPassword,
  mockVerifyFace,
} from './mock/auth_mock'
import type {
  LoginRequest,
  LoginResponse,
  User,
  RegisterRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyFaceRequest,
} from './models/auth'
import { clearFaceToken } from './secure_storage'
import { FCM_TOKEN_STORAGE_KEY } from '@/utils/pushNotifications'

export const ACCESS_TOKEN_KEY = 'access_token'

// Device push uses native FCM via @react-native-firebase/messaging

/** Auth actions require a live connection — fail fast with a clear message
 *  instead of a raw network error (no queuing; retrying a login/OTP later
 *  offline makes no sense). */
async function assertOnline(message: string): Promise<void> {
  if (!(await isEffectivelyOnline())) throw new Error(message)
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  if (ENV.USE_MOCK_DATA) {
    const res = await mockLogin(body)
    if (res.passwordExpired) await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
    else await AsyncStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken)
    return res
  }
  await assertOnline('You are offline. Connect to the internet to sign in.')
  const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/login', body)
  // Don't persist the token when the password is expired — the user isn't
  // fully signed in yet, they must change their password first. Also clear
  // any stale token from a previous session so it can't leak into requests.
  if (data.data.passwordExpired) await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
  else await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken)
  return data.data
}

export async function getMe(): Promise<User> {
  if (ENV.USE_MOCK_DATA) return mockGetMe()
  const res = await apiClient.get('/me')
  return res.data?.data ?? res.data
}

export async function register(body: RegisterRequest): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockRegister(body)
  await assertOnline('You are offline. Connect to the internet to register.')
  await apiClient.post('/auth/register', body)
}

/**
 * Authenticate using a previously-issued face_token (kept in secure storage).
 * Returns the same payload as `/auth/login`. Used by the Face ID quick-login
 * flow on the login screen.
 */
export async function verifyFace(body: VerifyFaceRequest): Promise<LoginResponse> {
  if (ENV.USE_MOCK_DATA) {
    const res = await mockVerifyFace(body.face_token)
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken)
    return res
  }
  await assertOnline('You are offline. Connect to the internet to sign in.')
  const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/verify-face', { face_token: body.face_token })
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken)
  return data.data
}

export async function verifyOtp(
  body: VerifyOtpRequest,
): Promise<{ resetToken?: string }> {
  if (ENV.USE_MOCK_DATA) {
    const ok = await mockVerifyOtp(body.otp)
    return ok ? { resetToken: 'mock-reset-token' } : {}
  }
  await assertOnline('You are offline. Connect to the internet to verify the code.')
  const { data } = await apiClient.post('/auth/verify-otp', body)
  return data?.data ?? data ?? {}
}

export async function forgotPassword(email: string): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockSendOtp(email)
  await assertOnline('You are offline. Connect to the internet to request a reset code.')
  await apiClient.post('/auth/forgot-password', { email })
}

export async function resetPassword(body: ResetPasswordRequest): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockResetPassword(body.newPassword)
  await assertOnline('You are offline. Connect to the internet to reset your password.')
  await apiClient.post('/auth/reset-password', body)
}

export async function changePassword(body: ChangePasswordRequest, accessToken?: string): Promise<void> {
  if (ENV.USE_MOCK_DATA) return
  await assertOnline('You are offline. Connect to the internet to change your password.')
  // `accessToken` lets the password-expired flow authenticate this one call
  // without persisting the token to AsyncStorage (see `login()`).
  const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
  await apiClient.post('/auth/change-password', body, config)
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
  await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY)
  if (ENV.USE_MOCK_DATA) return
  await apiClient.post('/auth/logout').catch(() => {})
}

export async function deleteAccount(password: string): Promise<void> {
  if (ENV.USE_MOCK_DATA) {
    await clearFaceToken()
    return
  }
  await assertOnline('You are offline. Connect to the internet to delete your account.')
  await apiClient.post('/auth/delete-account', { password, confirmation: 'DELETE' })
  await clearFaceToken()
}

/** Queues offline, unlike the rest of auth — a profile-info edit (name/phone)
 *  is a plain data save, not a live-session action. */
export async function updateMe(body: { name: string; phone: string }): Promise<User> {
  if (ENV.USE_MOCK_DATA) {
    const me = await mockGetMe()
    return { ...me, name: body.name, phone: body.phone }
  }
  const res = await offlineMutate('PATCH', '/me', body)
  return res.data?.data ?? res.data
}

export interface RegisterDeviceRequest {
  firebase_token: string | null
  platform: 'ios' | 'android'
}

export async function registerDevice(body: RegisterDeviceRequest): Promise<void> {
  if (ENV.USE_MOCK_DATA) return
  if (!body.firebase_token) return
  if (!(await isEffectivelyOnline())) return
  await apiClient.post('/me/device-token', body)
}


/** @deprecated use forgotPassword(email) — kept for forgot-password screen. */
export async function sendOtp(email: string): Promise<void> {
  return forgotPassword(email)
}
