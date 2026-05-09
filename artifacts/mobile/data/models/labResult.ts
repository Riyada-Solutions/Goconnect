export const LabResultStatus = {
  Pending: 'pending',
  InProgress: 'in_progress',
  ResultReady: 'result_ready',
  Cancelled: 'cancelled',
} as const
export type LabResultStatus =
  (typeof LabResultStatus)[keyof typeof LabResultStatus]

export interface LabResult {
  id: number
  patientId: number
  labCompany: string
  addedBy: string
  addedAt: string
  dueDate: string
  status: LabResultStatus
  resultPdfUrl?: string | null
  labOrderPdfUrl?: string | null
}
