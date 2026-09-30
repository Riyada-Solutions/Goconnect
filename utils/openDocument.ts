import { router } from 'expo-router'

export type DocumentKind = 'pdf' | 'image' | 'web'

/** Classifies a document by mime type first, then by URL extension. */
export function getDocumentKind(url: string, mimeType?: string | null): DocumentKind {
  const mime = mimeType?.toLowerCase() ?? ''
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  const path = url.split(/[?#]/)[0].toLowerCase()
  if (path.endsWith('.pdf')) return 'pdf'
  if (/\.(jpe?g|png|gif|webp|heic|bmp)$/.test(path)) return 'image'
  return 'web'
}

/** Opens a PDF or web document in the full-screen document viewer. */
export function openDocumentViewer(url: string, kind: 'pdf' | 'web', title?: string) {
  router.push({ pathname: '/document-viewer', params: { url, kind, title: title ?? '' } })
}
