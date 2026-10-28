/** Where a progress note was taken. Shared by the doctor and social-worker
 *  notes — the endpoint URL, not this value, decides which form it is. */
export type ProgressNoteLocation = "on_call" | "in_center" | "on_visit"
export type SocialWorkerLocation = ProgressNoteLocation

/** Display order, and the keys the API uses both as booleans and as `type`. */
export const PROGRESS_NOTE_LOCATIONS: readonly ProgressNoteLocation[] = [
  "on_call",
  "in_center",
  "on_visit",
]
export const SOCIAL_WORKER_LOCATIONS = PROGRESS_NOTE_LOCATIONS

/** API body fields for a location: `type` plus one boolean per location. */
export const progressNoteLocationBody = (location: ProgressNoteLocation) => ({
  type:      location,
  on_call:   location === "on_call",
  in_center: location === "in_center",
  on_visit:  location === "on_visit",
})

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
