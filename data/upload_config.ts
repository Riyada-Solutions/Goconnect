import { ENV } from '@/constants/env'

let _domain: string = ENV.API_BASE_URL

/** Returns the bare domain to use for webview / auto-login links. */
export function getWebBaseUrl(): string {
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
}
