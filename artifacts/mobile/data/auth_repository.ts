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
  // v2 contract: server expects `identifier` (the type already encodes that;
  // posting `body` verbatim is correct).
  const { data } = await apiClient.post('/auth/verify-otp', body)
  return data?.data ?? data ?? {}
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
  await clearFaceToken()
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

export interface RegisterDeviceRequest {
  fcm_token: string | null
  device_type: 'ios' | 'android'
}

export async function registerDevice(body: RegisterDeviceRequest): Promise<void> {
  if (ENV.USE_MOCK_DATA) return
  if (!body.fcm_token) return
  await apiClient.post('/me/device-token', body)
}


/** @deprecated use forgotPassword(email) — kept for forgot-password screen. */
export async function sendOtp(email: string): Promise<void> {
  return forgotPassword(email)
}
