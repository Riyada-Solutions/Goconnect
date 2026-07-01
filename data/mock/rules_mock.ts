import { ALL_BACKEND_RULES, BackendRuleKey } from '../models/rules'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Mock rules — returns every known backend rule key so that both FE semantic
 * checks (can("view_visits")) and direct backend-key checks
 * (can("visits.ReopenMyVisit")) resolve to true in mock mode.
 * Trim entries locally to test disabled flows.
 */
export async function mockGetRules(): Promise<BackendRuleKey[]> {
  await delay(300)
  return [...ALL_BACKEND_RULES]
}
