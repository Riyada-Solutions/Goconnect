import type { NotificationPreferences } from '../models/notificationPreferences'
import type { Machine } from '../models/machine'

const mockDelay = (ms = 400) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

let mockPrefs: NotificationPreferences = {
  pushNotifications: true,
  messages: true,
  visitAlerts: true,
  reminders: true,
  appUpdates: false,
}

export const MOCK_MACHINES: Machine[] = [
  {
    id: 1,
    name: 'Fresenius 5008-A',
    machineNumber: 'M-001',
    system: 'Hemodialysis',
    contactNumber: '+966500000001',
    warmerNumber: 'W-001',
    branchId: 2,
    isBackup: false,
    isolatedToPatient: null,
  },
  {
    id: 2,
    name: 'Fresenius 5008-B',
    machineNumber: 'M-002',
    system: 'Hemodialysis',
    contactNumber: '+966500000002',
    warmerNumber: 'W-002',
    branchId: 2,
    isBackup: true,
    isolatedToPatient: null,
  },
]

export async function mockGetNotificationPreferences(): Promise<NotificationPreferences> {
  await mockDelay(300)
  return { ...mockPrefs }
}

export async function mockUpdateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  await mockDelay(400)
  mockPrefs = { ...mockPrefs, ...patch }
  return { ...mockPrefs }
}

export async function mockUploadAvatar(_uri: string): Promise<{ avatarUrl: string }> {
  await mockDelay(800)
  return { avatarUrl: 'https://picsum.photos/seed/goconnect-avatar/200' }
}
