import AsyncStorage from '@react-native-async-storage/async-storage'
import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockLogin, mockRegister, mockSendOtp, mockVerifyOtp, mockResetPassword } from './mock/auth_mock'
import type { LoginCredentials, LoginResponse, RegisterData } from '../types/auth'

export async function login(body: LoginCredentials): Promise<LoginResponse> {
  if (ENV.USE_MOCK_DATA) return mockLogin(body)
  const { data } = await apiClient.post<LoginResponse>('/auth/login', body)
  return data
}

export async function register(body: RegisterData): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockRegister(body)
  await apiClient.post('/auth/register', body)
}

export async function sendOtp(email: string): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockSendOtp(email)
  await apiClient.post('/auth/forgot-password', { email })
}

export async function verifyOtp(code: string): Promise<boolean> {
  if (ENV.USE_MOCK_DATA) return mockVerifyOtp(code)
  const { data } = await apiClient.post<{ valid: boolean }>('/auth/verify-otp', { code })
  return data.valid
}

export async function resetPassword(newPassword: string): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockResetPassword(newPassword)
  await apiClient.post('/auth/reset-password', { password: newPassword })
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove(['@careconnect/user', '@careconnect/token'])
}

export async function getStoredAuth(): Promise<LoginResponse | null> {
  const [storedUser, storedToken] = await AsyncStorage.multiGet([
    '@careconnect/user',
    '@careconnect/token',
  ])
  const user = storedUser[1]
  const token = storedToken[1]
  if (user && token) return { user: JSON.parse(user), token }
  return null
}
