import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import {
  mockGetNotificationPreferences,
  mockUpdateNotificationPreferences,
  mockUploadAvatar,
} from './mock/settings_mock'
import type {
  NotificationPreferences,
  NotificationPreferencesPatch,
} from './models/notificationPreferences'

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (ENV.USE_MOCK_DATA) return mockGetNotificationPreferences()
  const res = await apiClient.get('/me/notification-preferences')
  return unwrapData<NotificationPreferences>(res.data)
}

export async function updateNotificationPreferences(
  patch: NotificationPreferencesPatch,
): Promise<NotificationPreferences> {
  if (ENV.USE_MOCK_DATA) return mockUpdateNotificationPreferences(patch)
  const res = await apiClient.patch('/me/notification-preferences', patch)
  return unwrapData<NotificationPreferences>(res.data)
}

export interface UploadAvatarParams {
  uri: string
  mimeType?: string
  fileName?: string
}

export async function uploadAvatar(
  params: UploadAvatarParams,
): Promise<{ avatarUrl: string }> {
  if (ENV.USE_MOCK_DATA) return mockUploadAvatar(params.uri)

  const formData = new FormData()
  const name = params.fileName ?? `avatar.${params.mimeType?.split('/')[1] ?? 'jpg'}`
  formData.append('avatar', {
    uri: params.uri,
    type: params.mimeType ?? 'image/jpeg',
    name,
  } as unknown as Blob)

  const res = await apiClient.post('/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrapData<{ avatarUrl: string }>(res.data)
}
