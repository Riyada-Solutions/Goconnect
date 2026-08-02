import AsyncStorage from '@react-native-async-storage/async-storage'

import { ACCESS_TOKEN_KEY } from '@/data/auth_repository'
import { getWebBaseUrl } from '@/data/upload_config'
import { log } from '@/utils/logger'

/**
 * Builds an auto-login web URL: `${webBaseUrl}/auto-login?token=...&to=...`.
 * `webBaseUrl` comes from the cached `upload_media_url` app setting (falling
 * back to the API domain if it was never fetched — see `data/upload_config.ts`).
 * `to` is the in-app-relative path the web app should land on after login.
 */
export async function buildAutoLoginUrl(to: string): Promise<string> {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
  const domain = getWebBaseUrl()

  console.log('buildAutoLoginUrl:', { domain, to, hasToken: !!token })

  if (!domain) {
    console.error('❌ buildAutoLoginUrl: NO DOMAIN SET! Using empty domain')
  }

  const params = new URLSearchParams({ token: token ?? '', to })
  const webBaseUrl = `${domain}/auto-login?${params.toString()}`

  console.log('✅ Built URL:', webBaseUrl)
  log('buildAutoLoginUrl', `domain=${domain}, to=${to}, hasToken=${!!token}`)
  return webBaseUrl;
}
export function getMedicationsUrl(visitId: string | number): Promise<string> {
  return buildAutoLoginUrl(`visits/${visitId}/edit?tab=medications`)
}

export function getDialysisOrderUrl(visitId: string | number): Promise<string> {
  return buildAutoLoginUrl(`visits/${visitId}/edit?tab=dialysis_order`)
}

 export function getMARUrl(visitId: string | number): Promise<string> {
  return buildAutoLoginUrl(`visits/${visitId}/edit?tab=medication-administration`)
}
 