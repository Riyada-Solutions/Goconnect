import type { LoginCredentials, LoginResponse } from '../../types/auth'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockLogin(body: LoginCredentials): Promise<LoginResponse> {
  await delay(600)
  if (body.username === 'super-admin' && body.password === 'Admin_123456') {
    return {
      user: {
        id: 1,
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@careconnect.sa',
        role: 'Super Admin',
        token: 'mock-token-xyz',
      },
      token: 'mock-token-xyz',
    }
  }
  throw new Error('Invalid credentials')
}

export async function mockRegister(_data: {
  registerCode: string
  phone: string
  name: string
  email: string
  branch: string
}): Promise<void> {
  await delay(800)
}

export async function mockSendOtp(_email: string): Promise<void> {
  await delay(800)
}

export async function mockVerifyOtp(_code: string): Promise<boolean> {
  await delay(800)
  return true
}

export async function mockResetPassword(_newPassword: string): Promise<void> {
  await delay(900)
}
