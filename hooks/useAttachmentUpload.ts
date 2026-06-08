import { useCallback, useState } from 'react'

import {
  uploadVisitAttachment,
  type AttachmentUploadResult,
} from '@/data/attachment_repository'

interface UploadInput {
  uri: string
  name?: string
  mimeType?: string
}

interface UseAttachmentUploadResult {
  /** Most recent upload response — `null` until something has been uploaded. */
  result: AttachmentUploadResult | null
  uploading: boolean
  error: string | null
  upload: (input: UploadInput) => Promise<AttachmentUploadResult | null>
  reset: () => void
}

/**
 * Upload a visit attachment via `POST /agent/attachments/upload`, bound to a
 * `visitId` and a `type` (e.g. `"referrals"`). Call `upload(file)` as soon as
 * the nurse picks a file, then read `result.fileName` when saving the form.
 */
export function useAttachmentUpload(
  visitId: number | string,
  type: string,
): UseAttachmentUploadResult {
  const [result, setResult] = useState<AttachmentUploadResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (input: UploadInput) => {
      setUploading(true)
      setError(null)
      try {
        const r = await uploadVisitAttachment({
          visitId,
          type,
          file: { uri: input.uri, name: input.name, mimeType: input.mimeType },
        })
        setResult(r)
        return r
      } catch (e: any) {
        setError(e?.message ?? 'Upload failed')
        setResult(null)
        return null
      } finally {
        setUploading(false)
      }
    },
    [visitId, type],
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, uploading, error, upload, reset }
}
