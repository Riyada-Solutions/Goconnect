import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { ENV } from '@/constants/env'
import { fmtJson, log } from '@/utils/logger'

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'
const APP_PLATFORM = Platform.OS === 'ios' ? 'ios' : 'android'

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
  config.headers['X-App-Version'] = APP_VERSION
  config.headers['Version'] = APP_VERSION
  config.headers['X-Platform'] = APP_PLATFORM

  log(
    TAG,
    `Request \n${config.method?.toUpperCase()} : ${config.baseURL}${config.url}\nParameter: ${fmtJson(config.params ?? {})}\nBody: ${fmtJson(config.data)}\nEND Request`,
  )

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const { method, baseURL, url } = response.config
    log(
      TAG,
      `Response \nStatus: ${response.status}\nURL: ${method?.toUpperCase()} ${baseURL}${url}\nResponse: ${fmtJson(response.data)}\nReceive END HTTP`,
    )
    return response
  },
  (error) => {
    log(
      TAG,
      `ERROR\nURL: ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}\nHTTP Status: ${error.response?.status ?? 'NO_RESPONSE'}\nAxios Code: ${error.code ?? 'NONE'}\nMessage: ${error.message}\nServer Body: ${fmtJson(error.response?.data ?? {})}`,
    )
    const data = error.response?.data
    let message = data?.message ?? error.message ?? 'Unknown error'

    // Laravel 422 returns the per-field failures under `errors` (keyed by
    // field name). The top-level `message` is generic ("The given data was
    // invalid."), so append the specific field messages — otherwise the user
    // sees a validation error with no clue which field to fix.
    const fieldErrors =
      data?.errors && typeof data.errors === 'object' ? data.errors : undefined
    if (fieldErrors) {
      const fields = Object.keys(fieldErrors)
      if (fields.length > 0) {
        const MAX = 15
        const lines = fields.slice(0, MAX).map((f) => {
          const msgs = fieldErrors[f]
          const first = Array.isArray(msgs) ? msgs[0] : String(msgs)
          return `• ${first || f}`
        })
        if (fields.length > MAX) lines.push(`• …and ${fields.length - MAX} more`)
        message = `${message}\n${lines.join('\n')}`
      }
    }

    // Carry the structured details on the Error so callers can map per-field
    // validation errors onto the matching form inputs (see register.tsx).
    const err = new Error(message) as Error & {
      status?: number
      fieldErrors?: Record<string, string[] | string>
    }
    if (error.response?.status) err.status = error.response.status
    if (fieldErrors) err.fieldErrors = fieldErrors
    throw err
  }
)
