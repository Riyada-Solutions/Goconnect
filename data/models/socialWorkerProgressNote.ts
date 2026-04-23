export type SocialWorkerLocation = "on_call" | "in_center"

export interface SocialWorkerProgressNote {
  id: number
  visitId: number
  note: string
  location: SocialWorkerLocation
  author: string
  createdAt: string // ISO 8601
}

export interface SocialWorkerProgressNoteInput {
  visitId: number
  note: string
  location: SocialWorkerLocation
}
