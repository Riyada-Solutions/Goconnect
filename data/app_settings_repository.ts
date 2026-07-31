import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { ENV } from '@/constants/env'

export interface AppSettings {
  allowRegister:  boolean
  allowGuestMode: boolean
  /** Base domain returned by the server, used for webview links only. */
  uploadMediaUrl: string
  /** Whether the procedure time edit (pencil) button is shown on the visit screen. */
  enableToggleProcedureButton: boolean
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

/**
 * Fetches settings from `/settings/app` and caches them on success. If the
 * call fails (offline, server error, etc.), falls back to the last cached
 * settings, and if none were ever cached, to `DEFAULT_APP_SETTINGS`.
 */
export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const res  = await publicClient.get('/settings/app')
    const items: Array<{ key: string; value: string }> = res.data?.data ?? []
    const map: Record<string, string> = {}
    for (const item of items) map[item.key] = item.value

    const settings: AppSettings = {
      allowRegister:  map['allow_register']  !== '0',
      allowGuestMode: map['allow_guest_mode'] !== '0',
      uploadMediaUrl: map['upload_media_url'] || fallbackDomain(),
      enableToggleProcedureButton: map['enable_toggle_procedure_button'] !== '0',
    }
    void cacheAppSettings(settings)
    return settings
  } catch {
    const cached = await readCachedAppSettings()
    return cached ?? DEFAULT_APP_SETTINGS
  }
}
