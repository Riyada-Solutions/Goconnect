import type { SupportMessageInput } from '../models/support'

export async function mockSubmitSupportMessage(
  _payload: SupportMessageInput,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 600))
}
