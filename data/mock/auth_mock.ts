import type { LoginRequest, LoginResponse, User, RegisterRequest } from '../models/auth'

const mockDelay = (ms = 600) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Dr. Sarah Johnson',
  role: 'Super Admin',
  hospital: 'King Abdulaziz Medical City',
  email: 'sarah.johnson@goconnect.sa',
  phone: '+966 50 123 4567',
  department: 'Nursing',
  employeeId: 'GC-2024-001',
  initials: 'SJ',
  avatarUrl: null,
}

export async function mockLogin(body: LoginRequest): Promise<LoginResponse> {
  await mockDelay()
  if (body.username === 'super-admin' && body.password === 'Admin_123456' || body.username === 'admin@codeconnect.sa' && body.password === 'password') {
    return { accessToken: 'mock-token-xyz', user: MOCK_USER }
  }
  throw new Error('Invalid credentials')
}

export async function mockGetMe(): Promise<User> {
  await mockDelay(300)
  return MOCK_USER
}

export async function mockRegister(_body: RegisterRequest): Promise<void> {
  await mockDelay(800)
}

export async function mockSendOtp(_email: string): Promise<void> {
  await mockDelay(800)
}

export async function mockVerifyOtp(_code: string): Promise<boolean> {
  await mockDelay(800)
  return true
}

export async function mockResetPassword(_newPassword: string): Promise<void> {
  await mockDelay(900)
}
