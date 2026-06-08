import type { Branch, Workspace, WorkspaceSystem } from './workspace'

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
  /** Currently-selected system ("center" | "home" | …). */
  selected_system?: WorkspaceSystem | null
  /** Id of the currently-selected branch. */
  selected_branch_id?: number | null
  /** Full record of the currently-selected branch (may be null until resolved). */
  selected_branch?: Branch | null
  /** Available branches + systems the user can switch between. */
  workspace?: Workspace | null
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
