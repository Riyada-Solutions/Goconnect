import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { ENV } from '@/constants/env'

// Dedicated axios client for the signature/upload host (different domain from
// the main API). Mirrors the auth-token + language headers used by apiClient,
// but with its own baseURL so calls hit `/signatures/upload` on that host.
const signatureClient = axios.create({
  baseURL: ENV.SIGNATURE_API_BASE_URL,
  timeout: 60000,
})

signatureClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  const lang = (await AsyncStorage.getItem('@goconnect/language')) || 'en'
  config.headers['Accept-Language'] = lang
  config.headers['X-Lang'] = lang
  return config
})

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
 */
export async function uploadSignature(
  file: SignatureFileLike,
): Promise<SignatureUploadResult> {
  const name = file.name ?? `signature_${Date.now()}.png`
  const type = file.type ?? inferMime(name)

  const fd = new FormData()
  fd.append('signature', {
    uri:  file.uri,
    name,
    type,
  } as unknown as Blob)

  const res = await signatureClient.post('/signatures/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const data = res.data?.data ?? res.data ?? {}
  return {
    signatureUrl: data.signature_url ?? data.signatureUrl ?? '',
    fullUrl:      data.full_url      ?? data.fullUrl      ?? '',
    fullPath:     data.full_path     ?? data.fullPath,
  }
}
