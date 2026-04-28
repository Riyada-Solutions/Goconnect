/** Body for `POST /support/messages` (§12.1). */
export interface SupportMessageInput {
  name: string
  email: string
  subject: string
  message: string
}
