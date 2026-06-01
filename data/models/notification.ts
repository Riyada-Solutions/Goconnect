/** Link target embedded in a notification row. */
export interface NotificationLink {
  /** e.g. "visit", "patient", "appointment" */
  type: string
  /** The linked resource's ID. */
  id: string
}

/**
 * Notification row returned by `GET /api/notifications`.
 * Matches the Postman v2 contract exactly.
 */
export interface ApiNotification {
  id: number
  /** e.g. "visit_assigned" | "lab_result" | "system" */
  type: string
  title: string
  body: string
  read: boolean
  /** ISO 8601 timestamp, e.g. "2026-05-20T08:51:00+03:00" */
  createdAt: string
  link?: NotificationLink | null
}

export interface NotificationListResponse {
  data: ApiNotification[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface NotificationListParams {
  filter?: 'all' | 'unread'
  per_page?: number
  page?: number
}
