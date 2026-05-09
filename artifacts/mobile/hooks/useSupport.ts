import { useMutation } from '@tanstack/react-query'

import { submitSupportMessage } from '../data/support_repository'
import type { SupportMessageInput } from '../data/models/support'

export function useSubmitSupportMessage() {
  return useMutation({
    mutationFn: (payload: SupportMessageInput) => submitSupportMessage(payload),
  })
}
