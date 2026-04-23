export interface NursingProgressNote {
  id: number
  visitId: number
  note: string
  author: string
  createdAt: string // ISO 8601
}

export interface NursingProgressNoteInput {
  visitId: number
  note: string
}
