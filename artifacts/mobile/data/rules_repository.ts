import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetRules } from './mock/rules_mock'
import type { RuleAction, RulesResponse } from './models/rules'

/**
 * Fetch the action-level permission list for the authenticated user.
 * The app calls this on app open (during the splash screen) and caches the
 * result in `AppContext` so every screen can consult `can(action)`.
 *
 * Returns a flat array of action keys. Anything not in the list is treated
 * as disabled. See [data/models/rules.ts] for the full action catalogue.
 */
export async function getRules(): Promise<RuleAction[]> {
  if (ENV.USE_MOCK_DATA) return mockGetRules()
  const { data } = await apiClient.get<{ data: RulesResponse } | RulesResponse>(
    '/me/rules',
  )
  const payload = (data as { data?: RulesResponse }).data ?? (data as RulesResponse)
  return payload.rules ?? []
}
