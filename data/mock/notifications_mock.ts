import type { ApiNotification, NotificationListResponse } from '../models/notification'

const mockDelay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms))

/** Build an ISO timestamp relative to now. */
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

let MOCK_NOTIFICATIONS: ApiNotification[] = [
  {
    id: 1,
    type: 'visit_assigned',
    title: 'New Visit Assigned',
    body: 'You have a home visit for Ahmed Al-Rashid at 10:00 AM – Riyadh, Al Olaya.',
    read: false,
    createdAt: minsAgo(9),
    link: { type: 'visit', id: '144' },
  },
  {
    id: 2,
    type: 'appointment_reminder',
    title: 'Upcoming Appointment',
    body: 'Clinic session with Fatima Al-Zahra starts in 30 minutes. Room 4, Floor 2.',
    read: false,
    createdAt: minsAgo(27),
    link: { type: 'appointment', id: '55' },
  },
  {
    id: 3,
    type: 'lab_result',
    title: 'Lab Results Ready',
    body: 'CBC and lipid panel for Khalid Al-Mutairi are now available in his profile.',
    read: false,
    createdAt: hoursAgo(1),
    link: { type: 'patient', id: '12' },
  },
  {
    id: 4,
    type: 'message',
    title: 'Message from Dr. Sara',
    body: 'Please review the updated care plan for Nora Al-Qahtani before 3 PM today.',
    read: false,
    createdAt: hoursAgo(2),
    link: null,
  },
  {
    id: 5,
    type: 'visit_completed',
    title: 'Visit Marked Complete',
    body: 'Home visit for Maha Al-Ghamdi has been closed and submitted for review.',
    read: true,
    createdAt: hoursAgo(4),
    link: { type: 'visit', id: '140' },
  },
  {
    id: 6,
    type: 'shift_change',
    title: 'Shift Update',
    body: 'Your Tuesday evening shift has been swapped with Nurse Reem Al-Harbi.',
    read: true,
    createdAt: hoursAgo(6),
    link: null,
  },
  {
    id: 7,
    type: 'patient_added',
    title: 'New Patient Assigned',
    body: 'Omar Al-Farsi (DOB 1972-04-15) has been added to your active patient list.',
    read: false,
    createdAt: daysAgo(1),
    link: { type: 'patient', id: '99' },
  },
  {
    id: 8,
    type: 'visit_assigned',
    title: 'Visit Rescheduled',
    body: 'Your follow-up with Saad Al-Dossari moved to Friday 2:00 PM – confirmed.',
    read: true,
    createdAt: daysAgo(1),
    link: { type: 'visit', id: '138' },
  },
  {
    id: 9,
    type: 'message',
    title: 'Care Coordinator Update',
    body: 'Discharge summary for Aisha Al-Zahrani has been reviewed and approved.',
    read: true,
    createdAt: daysAgo(1),
    link: null,
  },
  {
    id: 10,
    type: 'system',
    title: 'App Update Available',
    body: 'GoConnect v1.1.0 brings faster scheduling, offline access, and bug fixes.',
    read: true,
    createdAt: daysAgo(1),
    link: null,
  },
  {
    id: 11,
    type: 'appointment_reminder',
    title: 'Weekly Schedule Published',
    body: 'Your schedule for next week is live — 12 visits, 3 clinics assigned.',
    read: true,
    createdAt: daysAgo(5),
    link: null,
  },
  {
    id: 12,
    type: 'lab_result',
    title: 'Critical Lab Alert',
    body: 'Potassium level for Youssef Al-Anazi is critically low. Immediate review needed.',
    read: true,
    createdAt: daysAgo(6),
    link: { type: 'patient', id: '30' },
  },
  {
    id: 13,
    type: 'patient_added',
    title: 'Patient Transferred',
    body: 'Hind Al-Otaibi has been transferred from Ward 3 to your home-care caseload.',
    read: true,
    createdAt: daysAgo(8),
    link: { type: 'patient', id: '44' },
  },
]

export async function mockFetchNotifications(
  filter: 'all' | 'unread' = 'all',
  page = 1,
  perPage = 50,
): Promise<NotificationListResponse> {
  await mockDelay(500)
  const source = filter === 'unread'
    ? MOCK_NOTIFICATIONS.filter((n) => !n.read)
    : MOCK_NOTIFICATIONS
  const total = source.length
  const lastPage = Math.ceil(total / perPage) || 1
  const start = (page - 1) * perPage
  const data = source.slice(start, start + perPage)
  return {
    data,
    meta: { current_page: page, last_page: lastPage, per_page: perPage, total },
  }
}

export async function mockFetchUnreadCount(): Promise<{ count: number }> {
  await mockDelay(200)
  return { count: MOCK_NOTIFICATIONS.filter((n) => !n.read).length }
}

export async function mockMarkNotificationRead(id: number): Promise<void> {
  await mockDelay(200)
  MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  )
}

export async function mockMarkAllRead(): Promise<{ markedCount: number }> {
  await mockDelay(300)
  let count = 0
  MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map((n) => {
    if (!n.read) { count++; return { ...n, read: true } }
    return n
  })
  return { markedCount: count }
}

export async function mockDeleteNotification(id: number): Promise<void> {
  await mockDelay(200)
  MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.filter((n) => n.id !== id)
}
