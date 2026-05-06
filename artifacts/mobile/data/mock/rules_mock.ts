import { ALL_RULE_ACTIONS, RuleAction } from '../models/rules'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Mock rules — by default every action is enabled so the app behaves as if
 * the user is fully privileged. Trim entries from this list locally to test
 * disabled flows.
 */
export async function mockGetRules(): Promise<RuleAction[]> {
  await delay(300)
  return [...ALL_RULE_ACTIONS]
}
