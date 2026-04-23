import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/theme/spacing";

interface Options {
  /** Screen sits inside the bottom tab bar (needs extra bottom space). */
  hasTabBar?: boolean;
  /** Screen has a sticky CTA / action bar at the bottom. */
  hasActionBar?: boolean;
  /** Extra pixels to add to the top padding (for sticky top bars etc.). */
  extraTop?: number;
}

/**
 * Returns standardized padding values for any screen. Wrap a screen's
 * content with these instead of hand-rolling `insets + Platform.OS === "web" ? …`
 * every time.
 *
 *   const { topPad, botPad, horizontal, gap } = useScreenPadding({ hasTabBar: true });
 *   <ScrollView contentContainerStyle={{ padding: horizontal, paddingBottom: botPad, gap }} />
 */
export function useScreenPadding(options: Options = {}) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const topOffset = isWeb ? Spacing.webTopSafe : 0;

  let bottomOffset: number;
  if (isWeb) {
    bottomOffset = Spacing.webBottomSafe;
  } else if (options.hasTabBar) {
    bottomOffset = Spacing.tabBar;
  } else {
    bottomOffset = Spacing.screen.bottom;
  }
  if (options.hasActionBar) bottomOffset += Spacing.screen.actionBar;

  return {
    topPad: insets.top + topOffset + (options.extraTop ?? 0),
    botPad: insets.bottom + bottomOffset,
    horizontal: Spacing.screen.horizontal,
    gap: Spacing.screen.gap,
    listGap: Spacing.list.itemGap,
    insets,
  };
}
