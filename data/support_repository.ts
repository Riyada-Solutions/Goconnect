import { ENV } from '../constants/env'
import { offlinePost } from './offline_api'
import { mockSubmitSupportMessage } from './mock/support_mock'
import type { SupportMessageInput } from './models/support'

/**
 * Submit a help-and-support message from the in-app contact form. The backend
 * forwards the message to the support inbox and notifies the user by email.
 * Queues offline, same as other form saves.
 */
export async function submitSupportMessage(
  payload: SupportMessageInput,
): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockSubmitSupportMessage(payload)
  await offlinePost('/support/messages', payload as unknown as Record<string, unknown>)
}
