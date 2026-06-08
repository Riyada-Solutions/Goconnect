import type { NotificationPreferences } from '../models/notificationPreferences'
import type { Machine } from '../models/machine'
import type { Workspace } from '../models/workspace'

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

const mockWorkspace: Workspace = {
  branches: [
    {
      id: 1,
      branch_code: '01',
      name: 'Main Branch',
      medical_center_name: 'Medical Center',
      address: 'Riyadh',
      phone: '01000000000',
      email: 'main@branch.com',
    },
    {
      id: 2,
      branch_code: '02',
      name: 'Jeddah',
      medical_center_name: null,
      address: 'Jeddah',
      phone: '01000000001',
      email: 'branch1@branch.com',
    },
  ],
  systems: ['center', 'home'],
}

export async function mockGetWorkspace(): Promise<Workspace> {
  await mockDelay(400)
  return { branches: [...mockWorkspace.branches], systems: [...mockWorkspace.systems] }
}

export async function mockSetSelectedSystem(_system: string): Promise<void> {
  await mockDelay(350)
}

export async function mockSetSelectedBranch(_branchId: number): Promise<void> {
  await mockDelay(350)
}
