import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, logout, register, sendOtp, verifyOtp, resetPassword } from '../data/auth_repository'
import type { LoginCredentials, RegisterData } from '../types/auth'

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
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
    mutationFn: (data: RegisterData) => register(data),
  })
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (email: string) => sendOtp(email),
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (code: string) => verifyOtp(code),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (newPassword: string) => resetPassword(newPassword),
  })
}
