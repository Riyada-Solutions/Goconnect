import { useCallback, useState } from 'react'

import {
  uploadSignature,
  type SignatureUploadResult,
} from '@/data/signature_repository'

interface UploadInput {
  uri: string
  name?: string
  type?: string
}

interface UseSignatureUploadResult {
  /** Most recent upload response — `null` until something has been uploaded. */
  result: SignatureUploadResult | null
  /** True while a request is in flight. */
  uploading: boolean
  /** Human-readable error from the last failed upload. */
  error: string | null
  /** Upload now and return the result (also stored in `result`). */
  upload: (input: UploadInput) => Promise<SignatureUploadResult | null>
  /** Forget the cached result/error (e.g. when the user clears the field). */
  reset: () => void
}

/**
 * Wrap `uploadSignature` with React state. Call `upload(file)` as soon as the
 * user picks an image or finishes a signature pad; read `result.signatureUrl`
 * when sending the form to the server.
 */
export function useSignatureUpload(): UseSignatureUploadResult {
  const [result, setResult] = useState<SignatureUploadResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (input: UploadInput) => {
    setUploading(true)
    setError(null)
    try {
      const r = await uploadSignature(input)
      setResult(r)
      return r
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed')
      setResult(null)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, uploading, error, upload, reset }
}
