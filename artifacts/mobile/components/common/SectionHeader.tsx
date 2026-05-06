import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

interface SectionHeaderProps {
  title: string;
  /** Optional count pill next to the title (e.g. number of members). */
  count?: number | string;
  /** Optional right-aligned slot — actions, buttons, links, etc. */
  trailing?: React.ReactNode;
  /** Custom color for the leading accent bar. Defaults to the primary theme color. */
  accentColor?: string;
  style?: ViewStyle;
}

/**
 * Standard section header used across the app. Renders a short colored accent
 * bar followed by the title, an optional count pill, and an optional trailing
 * slot (e.g. action buttons). Use above every `<Card>` section so the visual
 * rhythm stays consistent.
 */
export function SectionHeader({
  title,
  count,
  trailing,
  accentColor = Colors.primary,
  style,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[s.header, style]}>
      <View style={[s.accent, { backgroundColor: accentColor }]} />
      <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {count !== undefined && count !== null ? (
        <View
          style={[s.countPill, { backgroundColor: `${accentColor}18` }]}
        >
          <Text style={[s.countText, { color: accentColor }]}>{count}</Text>
        </View>
      ) : null}
      {trailing ? <View style={s.trailing}>{trailing}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  accent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    flexShrink: 1,
  },
  countPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  trailing: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
