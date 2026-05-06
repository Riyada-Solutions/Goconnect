/**
 * Standard spacing tokens used across the app. Import from `@/theme/spacing`
 * (or via `@/theme`) and compose into style objects so every screen/card/row
 * uses the same scale. Prefer the semantic `Spacing.screen.*` / `Spacing.list.*`
 * tokens inside screens; use the raw scale (xs/sm/md/...) only for fine tuning.
 */
export const Spacing = {
  // ── Base scale ──────────────────────────────────────────────────────────
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,

  // ── Screen-level tokens ────────────────────────────────────────────────
  screen: {
    /** Horizontal gutter on every screen. */
    horizontal: 16,
    /** Space below a sticky top bar before content starts. */
    top: 12,
    /** Small bottom margin on detail screens (non-tab). */
    bottom: 16,
    /** Extra bottom space reserved for a sticky CTA / action bar. */
    actionBar: 80,
    /** Vertical gap between top-level cards / sections. */
    gap: 16,
  },

  // ── List tokens ─────────────────────────────────────────────────────────
  list: {
    /** Gap between sibling cards in a list. */
    itemGap: 10,
    /** Gap between grouped sections. */
    sectionGap: 16,
  },

  // ── Platform offsets ────────────────────────────────────────────────────
  /** Native bottom tab bar height. */
  tabBar: 84,
  /** Web app-shell chrome offsets (the wrapping navbar/footer). */
  webTopSafe: 67,
  webBottomSafe: 34,
} as const;

export type SpacingScale = keyof Omit<
  typeof Spacing,
  "screen" | "list" | "tabBar" | "webTopSafe" | "webBottomSafe"
>;
