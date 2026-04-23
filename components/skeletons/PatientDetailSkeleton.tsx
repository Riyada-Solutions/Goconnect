import React from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Shimmer } from "@/components/ui/Shimmer";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/theme/spacing";

export function PatientDetailSkeleton() {
  const { colors } = useTheme();
  const { topPad } = useScreenPadding();
  const base = colors.border;
  const highlight = colors.card;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View
        style={[
          s.topBar,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Shimmer width={38} height={38} radius={10} baseColor={base} highlightColor={highlight} />
        <Shimmer width={140} height={20} baseColor={base} highlightColor={highlight} />
      </View>

      {/* Hero */}
      <View style={[s.hero, { backgroundColor: colors.card }]}>
        <Shimmer width={72} height={72} radius={36} baseColor={base} highlightColor={highlight} />
        <View style={{ flex: 1, gap: 8 }}>
          <Shimmer width="70%" height={20} baseColor={base} highlightColor={highlight} />
          <Shimmer width="50%" height={14} baseColor={base} highlightColor={highlight} />
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Shimmer width={70} height={22} radius={11} baseColor={base} highlightColor={highlight} />
            <Shimmer width={55} height={22} radius={11} baseColor={base} highlightColor={highlight} />
          </View>
        </View>
      </View>

      {/* Demographics grid card */}
      <View style={{ paddingHorizontal: Spacing.screen.horizontal, marginTop: Spacing.screen.gap, gap: Spacing.screen.gap }}>
        <SectionGridSkeleton items={6} base={base} highlight={highlight} />
        <SectionGridSkeleton items={4} base={base} highlight={highlight} />
      </View>
    </View>
  );
}

function SectionGridSkeleton({
  items,
  base,
  highlight,
}: {
  items: number;
  base: string;
  highlight: string;
}) {
  return (
    <View>
      <Shimmer width={140} height={16} baseColor={base} highlightColor={highlight} />
      <Card style={{ marginTop: 8, padding: 12 }}>
        <View style={s.grid}>
          {Array.from({ length: items }).map((_, i) => (
            <View key={i} style={s.gridItem}>
              <Shimmer width={28} height={28} radius={8} baseColor={base} highlightColor={highlight} />
              <View style={{ flex: 1, gap: 4 }}>
                <Shimmer width="60%" height={11} baseColor={base} highlightColor={highlight} />
                <Shimmer width="85%" height={13} baseColor={base} highlightColor={highlight} />
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
    columnGap: 8,
  },
  gridItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexBasis: "48%",
    flexGrow: 1,
  },
});
