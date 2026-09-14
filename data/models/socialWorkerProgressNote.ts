export type SocialWorkerLocation = "on_call" | "in_center" | "on_visit"

/** Display order, and the keys the API uses both as booleans and as `type`. */
export const SOCIAL_WORKER_LOCATIONS: readonly SocialWorkerLocation[] = [
  "on_call",
  "in_center",
  "on_visit",
]

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
