import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { ENV } from '@/constants/env'
import { fmtJson, log } from '@/utils/logger'

export interface AppSettings {
  allowRegister:  boolean
  allowGuestMode: boolean
  /** Base domain returned by the server, used for webview links only. */
  uploadMediaUrl: string
  /** Whether the procedure time edit (pencil) button is shown on the visit screen. */
  enableToggleProcedureButton: boolean
  /** When true, the app stays on splash and requires an update from the store. */
  forceUpdate: boolean
}

// EXPO_PUBLIC_WEBVIEW_DOMAIN, used for the webview domain when the /settings/app
// call fails and there is no cached value to fall back to yet.
function fallbackDomain(): string {
  return process.env.EXPO_PUBLIC_WEBVIEW_DOMAIN ?? ''
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  allowRegister:  true,
  allowGuestMode: true,
  uploadMediaUrl: fallbackDomain(),
  enableToggleProcedureButton: true,
  forceUpdate: false,
}

/** Settings API may send booleans, 0/1, or "true"/"false" strings. */
function parseFlag(value: unknown, defaultWhenMissing: boolean): boolean {
  if (value === undefined || value === null || value === '') return defaultWhenMissing
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const s = String(value).trim().toLowerCase()
  if (s === '0' || s === 'false' || s === 'no' || s === 'off') return false
  if (s === '1' || s === 'true' || s === 'yes' || s === 'on') return true
  return defaultWhenMissing
}

const APP_SETTINGS_CACHE_KEY = '@goconnect/app_settings'

async function readCachedAppSettings(): Promise<AppSettings | null> {
  try {
    const raw = await AsyncStorage.getItem(APP_SETTINGS_CACHE_KEY)
    return raw ? (JSON.parse(raw) as AppSettings) : null
  } catch {
    return null
  }
}

async function cacheAppSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_SETTINGS_CACHE_KEY, JSON.stringify(settings))
  } catch {
    // non-fatal — worst case the next app open re-fetches instead of reusing the cache
  }
}

// Plain client with no auth header — /settings/app is a public endpoint
// called before the user logs in. Using apiClient would inject a stale or
// missing Bearer token and produce a noisy 401 on first launch.
const publicClient = axios.create({
  baseURL: `${ENV.API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

const SETTINGS_TAG = 'API Request'
publicClient.interceptors.request.use((config) => {
  log(
    SETTINGS_TAG,
    `Request \n${config.method?.toUpperCase()} : ${config.baseURL}${config.url}\nParameter: ${fmtJson(config.params ?? {})}\nBody: ${fmtJson(config.data)}\nEND Request`,
  )
  return config
})
publicClient.interceptors.response.use(
  (response) => {
    const { method, baseURL, url } = response.config
    log(
      SETTINGS_TAG,
      `Response \nStatus: ${response.status}\nURL: ${method?.toUpperCase()} ${baseURL}${url}\nResponse: ${fmtJson(response.data)}\nReceive END HTTP`,
    )
    return response
  },
  (error) => {
    log(
      SETTINGS_TAG,
      `ERROR\nURL: ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}\nHTTP Status: ${error.response?.status ?? 'NO_RESPONSE'}\nAxios Code: ${error.code ?? 'NONE'}\nMessage: ${error.message}\nServer Body: ${fmtJson(error.response?.data ?? {})}`,
    )
    throw error
  },
)

/**
 * Fetches settings from `/settings/app` and caches them on success. If the
 * call fails (offline, server error, etc.), falls back to the last cached
 * settings, and if none were ever cached, to `DEFAULT_APP_SETTINGS`.
 */
export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const res  = await publicClient.get('/settings/app')
    const items: Array<{ key: string; value: unknown }> = res.data?.data ?? []
    const map: Record<string, unknown> = {}
    for (const item of items) map[item.key] = item.value

    const settings: AppSettings = {
      allowRegister:  parseFlag(map['allow_register'], true),
      allowGuestMode: parseFlag(map['allow_guest_mode'], true),
      uploadMediaUrl: (typeof map['upload_media_url'] === 'string' && map['upload_media_url'])
        ? map['upload_media_url']
        : fallbackDomain(),
      enableToggleProcedureButton: parseFlag(map['enable_toggle_procedure_button'], true),
      forceUpdate: parseFlag(map['force_update'], false),
    }
    void cacheAppSettings(settings)
    return settings
  } catch {
    const cached = await readCachedAppSettings()
    return cached ? { ...DEFAULT_APP_SETTINGS, ...cached } : DEFAULT_APP_SETTINGS
  }
}
