import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  login,
  logout,
  register,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../data/auth_repository'
import type {
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
} from '../data/models/auth'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (res) => {
      queryClient.setQueryData(['me'], res.user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (body: VerifyOtpRequest) => verifyOtp(body),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: ResetPasswordRequest) => resetPassword(body),
  })
}

// Legacy alias — old callers
export const useSendOtp = useForgotPassword
