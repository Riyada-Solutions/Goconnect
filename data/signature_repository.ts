import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { ENV } from '@/constants/env'
import { isEffectivelyOnline } from '@/context/NetworkContext'

const UPLOAD_MEDIA_URL_KEY = '@goconnect/upload_media_url'

// Create axios client — baseURL will be set dynamically before each request
let signatureClient = axios.create({
  timeout: 60000,
})

// Response error handler
signatureClient.interceptors.response.use(
  (r) => r,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'Upload failed'
    throw new Error(message)
  },
)

export interface SignatureUploadResult {
  /** Relative file name returned by the server (e.g. `6a12e1349ef07.png`). Send this back in form save APIs. */
  signatureUrl: string
  /** Absolute URL to the uploaded file. */
  fullUrl: string
  /** Server-side absolute path (debugging only). */
  fullPath?: string
}

interface SignatureFileLike {
  /** Local file URI (`file://…`) **or** base64 data URI (`data:image/png;base64,…`). */
  uri: string
  /** File name sent to the server (e.g. `signature.png`, `attachment.jpg`). */
  name?: string
  /** MIME type — inferred from name extension when omitted. */
  type?: string
}

function inferMime(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.png'))  return 'image/png'
  if (lower.endsWith('.pdf'))  return 'application/pdf'
  if (lower.endsWith('.heic')) return 'image/heic'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif'))  return 'image/gif'
  return 'image/jpeg'
}

/**
 * Upload a signature/image file to the shared `/signatures/upload` endpoint.
 *
 * Use this **immediately** after the user picks an attachment or finishes a
 * signature pad, then keep the returned `signatureUrl` in form state. When the
 * user saves the form, send `signatureUrl` (not the binary file) to the form's
 * save endpoint.
 *
 * Response shape from the server:
 *   { data: { signature_url, full_url, full_path }, status, message }
 *
 * Not queued offline — this is a pre-upload step; the caller's form-save
 * falls back to submitting the signature inline as multipart (which *does*
 * queue). Failing fast here with a clear "offline" error, instead of letting
 * the request time out, skips straight to that fallback.
 */
export async function uploadSignature(
  file: SignatureFileLike,
): Promise<SignatureUploadResult> {
  if (!(await isEffectivelyOnline())) {
    throw new Error('Offline — signature will be attached when the form is saved.')
  }

  // Get uploadMediaUrl from settings (saved by AppContext when settings load)
  const uploadMediaUrl = await AsyncStorage.getItem(UPLOAD_MEDIA_URL_KEY)
  const baseUrl = uploadMediaUrl || ENV.API_BASE_URL

  // Create client with the correct base URL
  const client = axios.create({
    baseURL: `${baseUrl}/api`,
    timeout: 60000,
  })

  // Add auth headers
  const token = await AsyncStorage.getItem('access_token')
  if (token) client.defaults.headers.common.Authorization = `Bearer ${token}`
  const lang = (await AsyncStorage.getItem('@goconnect/language')) || 'en'
  client.defaults.headers.common['Accept-Language'] = lang
  client.defaults.headers.common['X-Lang'] = lang

  const name = file.name ?? `signature_${Date.now()}.png`
  const type = file.type ?? inferMime(name)

  const fd = new FormData()
  fd.append('signature', {
    uri:  file.uri,
    name,
    type,
  } as unknown as Blob)

  console.log(`[Signature Upload] Starting upload for ${name}`)
  console.log(`[Signature Upload] Using URL: ${baseUrl}/api/signatures/upload`)
  const res = await client.post('/signatures/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const data = res.data?.data ?? res.data ?? {}
  const result = {
    signatureUrl: data.signature_url ?? data.signatureUrl ?? '',
    fullUrl:      data.full_url      ?? data.fullUrl      ?? '',
    fullPath:     data.full_path     ?? data.fullPath,
  }
  console.log(`[Signature Upload] Success - URL: ${result.signatureUrl}`)
  return result
}
