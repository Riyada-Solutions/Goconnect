export interface User {
  id: string
  name: string
  role: string | null
  hospital: string | null
  email: string
  phone: string | null
  /** Opaque token used by `POST /auth/verify-face` for biometric (Face ID) login.
   *  Stored in OS secure storage when the user enables Face ID in settings. */
  face_token?: string | null
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

export interface VerifyFaceRequest {
  face_token: string
}

export interface RegisterRequest {
  registerCode?: string
  phone: string
  username: string
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface VerifyOtpRequest {
  purpose: 'register' | 'reset_password'
  email: string
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
