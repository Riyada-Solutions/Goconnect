export interface User {
  id: string
  name: string
  role: string
  hospital: string | null
  email: string
  phone: string | null
  department: string | null
  employeeId: string
  initials?: string
  avatarUrl?: string | null
  /** @deprecated use avatarUrl */
  avatar?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface RegisterRequest {
  registerCode: string
  phone: string
  fullName: string
  email: string
}

export interface VerifyOtpRequest {
  purpose: 'register' | 'reset_password'
  identifier: string
  otp: string
}

export interface ResetPasswordRequest {
  email: string
  resetToken: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface SessionResponse {
  user: User
  expiresAt: string
}

export interface HeartbeatResponse {
  expiresAt: string
}

export interface NotificationSettings {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  vibration: boolean
  sound_alerts: boolean
  quiet_hours_start: string
  quiet_hours_end: string
}

// Legacy aliases — keep existing callers compiling
export type LoginCredentials = LoginRequest
export type RegisterData = RegisterRequest
