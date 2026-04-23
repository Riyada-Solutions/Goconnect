import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ENV } from '@/constants/env'
import { log } from '@/utils/logger'

const TAG = 'API Request'

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const lang = (await AsyncStorage.getItem('@goconnect/language')) || 'en'
  config.headers['Accept-Language'] = lang
  config.headers['X-Lang'] = lang

  log(
    TAG,
    `Request \n${config.method?.toUpperCase()} : ${config.baseURL}${config.url}  \nParameter: ${JSON.stringify(config.params ?? {})}; \nBody: ${config.data ? JSON.stringify(config.data) : '{}'}\nEND Request`,
  )

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const { method, baseURL, url } = response.config
    log(
      TAG,
      `Response \nStatus: ${response.status}\nURL: ${method?.toUpperCase()} ${baseURL}${url}\nResponse: ${JSON.stringify(response.data)}\nReceive END HTTP`,
    )
    return response
  },
  (error) => {
    log(
      TAG,
      `ERROR\nURL: ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}\nHTTP Status: ${error.response?.status ?? 'NO_RESPONSE'}\nAxios Code: ${error.code ?? 'NONE'}\nMessage: ${error.message}\nServer Body: ${JSON.stringify(error.response?.data ?? {})}`,
    )
    const message =
      error.response?.data?.message ?? error.message ?? 'Unknown error'
    throw new Error(message)
  }
)
