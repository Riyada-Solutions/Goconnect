import type { User } from "@/data/models/auth";

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Human label for the user's selected system ("center" → "Center"). */
export function systemLabel(
  system: string | null | undefined,
  translate?: (key: string) => string,
): string | null {
  if (!system) return null;
  const key = `system_${system}`;
  const translated = translate?.(key);
  return translated && translated !== key ? translated : capitalize(system);
}

/**
 * Compact "System • Branch" label for the current workspace, or null when the
 * user has neither selected. Pass the app `t` to localize the system name.
 */
export function formatWorkspace(
  user: User | null,
  translate?: (key: string) => string,
): string | null {
  if (!user) return null;
  const sys = systemLabel(user.selected_system, translate);
  const branch = user.selected_branch?.name ?? null;
  const parts = [sys, branch].filter(Boolean);
  return parts.length ? parts.join(" • ") : null;
}
