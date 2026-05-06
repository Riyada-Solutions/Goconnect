import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockSubmitSupportMessage } from './mock/support_mock'
import type { SupportMessageInput } from './models/support'

/**
 * Submit a help-and-support message from the in-app contact form. The backend
 * forwards the message to the support inbox and notifies the user by email.
 */
export async function submitSupportMessage(
  payload: SupportMessageInput,
): Promise<void> {
  if (ENV.USE_MOCK_DATA) return mockSubmitSupportMessage(payload)
  await apiClient.post('/support/messages', payload)
}
