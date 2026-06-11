import { ENV } from '@/constants/env'

let _uploadApiBase: string = ENV.API_BASE_URL

/** Returns the base URL (with /api) to use for file upload requests. */
export function getUploadApiBase(): string {
  return _uploadApiBase
}

/**
 * Called once on app startup when `upload_media_url` is returned by the
 * settings API. Normalises the domain value into a full API base URL.
 * e.g. "https://staging.careconnectksa.com/" → "https://staging.careconnectksa.com/api"
 */
export function setUploadApiBase(url: string): void {
  const stripped = url.replace(/\/+$/, '')
  _uploadApiBase = stripped.endsWith('/api') ? stripped : `${stripped}/api`
}
