import AsyncStorage from '@react-native-async-storage/async-storage'

import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import {
  mockLogin,
  mockGetMe,
  mockRegister,
  mockSendOtp,
  mockVerifyOtp,
  mockResetPassword,
} from './mock/auth_mock'
import type {
  LoginRequest,
  LoginResponse,
  User,
  RegisterRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  NotificationSettings,
} from './models/auth'

export const ACCESS_TOKEN_KEY = 'access_token'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  if (ENV.USE_MOCK_DATA) {
    const res = await mockLogin(body)
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken)
    return res
  }
  const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/login', body)
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken)
  return data.data
}

export async function getMe(): Promise<User> {
  if (ENV.USE_MOCK_DATA) return mockGetMe()
  const res = await apiClient.get('/me')
  return res.data?.data ?? res.data
}

export async function register(body: RegisterRequest): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockRegister(body)
  await apiClient.post('/auth/register', body)
}

export async function verifyOtp(
  body: VerifyOtpRequest,
): Promise<{ resetToken?: string }> {
  if (ENV.USE_MOCK_DATA) {
    const ok = await mockVerifyOtp(body.otp)
    return ok ? { resetToken: 'mock-reset-token' } : {}
  }
  const { data } = await apiClient.post('/auth/verify-otp', body)
  return data?.data ?? data ?? {}
}

export async function resendOtp(purpose: string, identifier: string): Promise<void> {
  if (ENV.USE_MOCK_DATA) return
  await apiClient.post('/auth/resend-otp', { purpose, identifier })
}

export async function forgotPassword(email: string): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockSendOtp(email)
  await apiClient.post('/auth/forgot-password', { email })
}

export async function resetPassword(body: ResetPasswordRequest): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockResetPassword(body.newPassword)
  await apiClient.post('/auth/reset-password', body)
}

export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  if (ENV.USE_MOCK_DATA) return
  await apiClient.post('/auth/change-password', body)
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
  if (ENV.USE_MOCK_DATA) return
  await apiClient.post('/auth/logout').catch(() => {})
}

export async function deleteAccount(password: string): Promise<void> {
  if (ENV.USE_MOCK_DATA) return
  await apiClient.post('/auth/delete-account', { password, confirmation: 'DELETE' })
}

export async function updateMe(body: { name: string; phone: string }): Promise<User> {
  if (ENV.USE_MOCK_DATA) {
    const me = await mockGetMe()
    return { ...me, name: body.name, phone: body.phone }
  }
  const res = await apiClient.patch('/me', body)
  return res.data?.data ?? res.data
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (ENV.USE_MOCK_DATA) {
    return {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      vibration: true,
      sound_alerts: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '06:00',
    }
  }
  const res = await apiClient.get('/settings/notifications')
  const d = res.data?.data ?? res.data
  return {
    email_notifications: d.email_notifications ?? true,
    sms_notifications: d.sms_notifications ?? true,
    push_notifications: d.push_notifications ?? true,
    vibration: d.vibration ?? true,
    sound_alerts: d.sound_alerts ?? true,
    quiet_hours_start: d.quiet_hours_start ?? '22:00',
    quiet_hours_end: d.quiet_hours_end ?? '06:00',
  }
}

export async function updateNotificationSettings(
  body: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  if (ENV.USE_MOCK_DATA) return getNotificationSettings()
  const res = await apiClient.put('/settings/notifications', body)
  return res.data?.data ?? res.data
}

export async function updateDeviceToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  if (ENV.USE_MOCK_DATA) return
  await apiClient.post('/me/device-token', { token, platform })
}

// ── Legacy wrappers used by existing hooks/screens ───────────────────────────

/** @deprecated use forgotPassword(email) */
export async function sendOtp(email: string): Promise<void> {
  return forgotPassword(email)
}

/** @deprecated token is no longer persisted as a pair; use getMe() + AsyncStorage token */
export async function getStoredAuth(): Promise<{ user: User; token: string } | null> {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token) return null
  try {
    const user = await getMe()
    return { user, token }
  } catch {
    return null
  }
}
