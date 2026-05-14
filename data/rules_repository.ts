import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { mockGetRules } from './mock/rules_mock'
import type { RulesResponse } from './models/rules'

/**
 * Fetch the backend permission list for the authenticated user.
 * The app calls this on app open (during the splash screen) and caches the
 * result in `AppContext` so every screen can consult `can(action)`.
 *
 * Returns the raw backend rule strings (e.g. `patients.flowsheet.edit`).
 * FE semantic rule keys are translated via `FE_RULE_TO_BACKEND` in
 * `data/models/rules.ts`. Anything that doesn't map is treated as allowed.
 */
export async function getRules(): Promise<string[]> {
  if (ENV.USE_MOCK_DATA) return mockGetRules() as unknown as string[]
  const { data } = await apiClient.get<{ data: RulesResponse } | RulesResponse>(
    '/me/rules',
  )
  const payload = (data as { data?: RulesResponse }).data ?? (data as RulesResponse)
  return payload.rules ?? []
}
