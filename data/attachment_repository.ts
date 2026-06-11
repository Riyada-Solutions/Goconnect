import { apiClient } from './api_client'
import { getUploadApiBase } from './upload_config'

export interface AttachmentUploadResult {
  /** Server-stored file name (e.g. `hf_20260602_120737_…png`).
   *  Send this back to the form save API. */
  name: string
  /** Stored file name on disk (server `file_name`). */
  fileName: string
  /** Absolute public URL to the uploaded file. */
  fileUrl: string
  /** MIME type reported by the server. */
  mimeType?: string
}

interface AttachmentFileLike {
  /** Local file URI (`file://…`). */
  uri: string
  /** Original file name (e.g. `scan.jpg`). */
  name?: string
  /** MIME type — inferred from the name extension when omitted. */
  mimeType?: string
}

function inferMime(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.heic')) return 'image/heic'
  return 'image/jpeg'
}

/**
 * Upload a visit attachment to `POST /agent/attachments/upload`.
 *
 * Two-step flow: call this immediately after the nurse picks a file, keep the
 * returned `name`, then send `name` to the form's save endpoint. The server
 * derives the patient from `visit_id` and stores the file in
 * `tmp-{type}-{patient_id}-{visit_id}` until the form is saved.
 *
 * Allowed file types: jpeg, png, jpg, webp, pdf (max 10 MB).
 *
 * Response shape:
 *   { data: { id, name, file_name, file_url, file_size, mime_type, uploaded_at },
 *     status, message }
 */
export async function uploadVisitAttachment(params: {
  visitId: number | string
  /** Attachment category, e.g. `"referrals"`. */
  type: string
  file: AttachmentFileLike
}): Promise<AttachmentUploadResult> {
  const name = params.file.name ?? 'attachment'
  const mime = params.file.mimeType ?? inferMime(name)

  if (ENV.USE_MOCK_DATA) {
    return {
      name: `mock_${name}`,
      fileName: name,
      fileUrl: params.file.uri,
      mimeType: mime,
    }
  }

  const fd = new FormData()
  fd.append('visit_id', String(params.visitId))
  fd.append('type', params.type)
  fd.append('attachment', {
    uri: params.file.uri,
    name,
    type: mime,
  } as unknown as Blob)

  const res = await apiClient.post('/agent/attachments/upload', fd, {
    baseURL: getUploadApiBase(),
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const data = res.data?.data ?? res.data ?? {}
  return {
    name: data.name ?? '',
    fileName: data.file_name ?? '',
    fileUrl: data.file_url ?? '',
    mimeType: data.mime_type,
  }
}
