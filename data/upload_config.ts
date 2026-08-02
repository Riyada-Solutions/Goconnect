import AsyncStorage from '@react-native-async-storage/async-storage'
import { ENV } from '@/constants/env'

// API_BASE_URL is the bare domain (e.g. "https://nurse-app.careconnectksa.com")
// This is used as-is for webview links; API calls append /api when creating axios instances
let _domain: string = ENV.API_BASE_URL.replace(/\/+$/, '')
const WEB_DOMAIN_CACHE_KEY = '@goconnect/web_domain'

console.log('🔧 upload_config initialized:', { ENV_API_BASE_URL: ENV.API_BASE_URL, _domain })

/** Returns the bare domain to use for webview / auto-login links. */
export function getWebBaseUrl(): string {
  console.log('getWebBaseUrl called:', { _domain })
  return _domain
}

/**
 * Called once on app startup with the `upload_media_url` returned by the
 * settings API (or its fallback). This domain is used for webview links
 * ONLY — regular API calls and file uploads always use `EXPO_PUBLIC_API_BASE_URL`.
 * e.g. "https://staging.careconnectksa.com/" → "https://staging.careconnectksa.com"
 */
export function setWebDomain(url: string): void {
  const stripped = url.replace(/\/+$/, '')
  _domain = stripped.endsWith('/api') ? stripped.slice(0, -4) : stripped
  try {
    AsyncStorage.setItem(WEB_DOMAIN_CACHE_KEY, _domain)
  } catch {
    // non-fatal — worst case the next app open re-fetches
  }
}

export async function restoreCachedWebDomain(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(WEB_DOMAIN_CACHE_KEY)
    if (cached) _domain = cached
  } catch {
    // ignore — keep using default
  }
}
