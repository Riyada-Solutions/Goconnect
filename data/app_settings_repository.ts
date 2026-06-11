import { apiClient } from './api_client'

export interface AppSettings {
  allowRegister:  boolean
  allowGuestMode: boolean
  /** Base domain returned by the server to use for file uploads. Null = use app default. */
  uploadMediaUrl: string | null
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  allowRegister:  true,
  allowGuestMode: true,
  uploadMediaUrl: null,
}

export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const res  = await apiClient.get('/settings/app')
    const items: Array<{ key: string; value: string }> = res.data?.data ?? []
    const map: Record<string, string> = {}
    for (const item of items) map[item.key] = item.value

    return {
      allowRegister:  map['allow_register']  !== '0',
      allowGuestMode: map['allow_guest_mode'] !== '0',
      uploadMediaUrl: map['upload_media_url'] ?? null,
    }
  } catch {
    return DEFAULT_APP_SETTINGS
  }
}
