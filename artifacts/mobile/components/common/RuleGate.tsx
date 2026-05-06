import React from "react";

import { useApp } from "@/context/AppContext";
import type { RuleAction } from "@/data/models/rules";

interface RuleGateProps {
  /** Single action key, or array — children render only when ALL keys are granted. */
  action: RuleAction | RuleAction[];
  /** Optional placeholder shown when the rule is missing (default: render nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Hide a piece of UI when the user does not have the required rule(s).
 *
 *   <RuleGate action="edit_profile">
 *     <Button title={t("editProfile")} onPress={openEdit} />
 *   </RuleGate>
 *
 * Use this for action buttons / nav entries. For primary CTAs where you'd
 * rather show a "not allowed" message, use `useRuleGuard()` and gate the
 * press handler instead.
 */
export function RuleGate({ action, fallback = null, children }: RuleGateProps) {
  const { can } = useApp();
  const actions = Array.isArray(action) ? action : [action];
  const allowed = actions.every((a) => can(a));
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
