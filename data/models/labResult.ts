export const LabResultStatus = {
  Pending: 'pending',
  InProgress: 'in_progress',
  ResultReady: 'result_ready',
  Cancelled: 'cancelled',
} as const
export type LabResultStatus =
  (typeof LabResultStatus)[keyof typeof LabResultStatus]

/** A single test row on a lab order (e.g. "AST — 30 U/L"). */
export interface LabTestResult {
  id: number
  testName: string
  value: string
  unit?: string | null
  /** Display text, e.g. "10.00 - 45.00". */
  referenceRange?: string | null
  isAbnormal?: boolean | null
  description?: string | null
  notes?: string | null
}

/** A section of test rows on a lab order (e.g. "Hematology"), as grouped by the backend. */
export interface LabResultGroup {
  groupId: number
  groupName: string
  /** Display order — lower first. */
  sort: number
  results: LabTestResult[]
}

/** A file attached to a lab order — may be a PDF, an image, or any URL. */
export interface LabDocument {
  id: number
  url: string
  fileName?: string | null
  /** e.g. "application/pdf", "image/jpeg". Falls back to the URL extension. */
  mimeType?: string | null
  description?: string | null
  uploadedBy?: string | null
  uploadedAt?: string | null
}

export interface LabResult {
  id: number
  patientId: number
  labCompany: string
  addedBy: string | null
  addedAt: string
  dueDate: string
  status: LabResultStatus
  resultPdfUrl?: string | null
  labOrderPdfUrl?: string | null
  results?: LabTestResult[]
  /** Same rows as `results`, grouped and sorted by the backend. Preferred for display. */
  groups?: LabResultGroup[]
  documents?: LabDocument[]
}
