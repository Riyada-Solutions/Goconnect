import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ENV } from '../constants/env'

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@careconnect/token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? error.message ?? 'Unknown error'
    throw new Error(message)
  }
)
