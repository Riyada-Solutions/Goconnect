import React from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Shimmer } from "@/components/ui/Shimmer";
import { useTheme } from "@/hooks/useTheme";

export function LabResultCardSkeleton() {
  const { colors } = useTheme();
  const base = colors.border;
  const highlight = colors.card;

  return (
    <Card style={s.card}>
      {/* Header: id badge + status */}
      <View style={s.headerRow}>
        <Shimmer width={60} height={22} radius={8} baseColor={base} highlightColor={highlight} />
        <Shimmer width={90} height={22} radius={10} baseColor={base} highlightColor={highlight} />
      </View>

      {/* Lab company */}
      <Shimmer width="70%" height={16} baseColor={base} highlightColor={highlight} />

      {/* Meta grid */}
      <View style={[s.metaGrid, { borderTopColor: colors.borderLight }]}>
        <Shimmer width="48%" height={14} baseColor={base} highlightColor={highlight} />
        <Shimmer width="48%" height={14} baseColor={base} highlightColor={highlight} />
        <Shimmer width="48%" height={14} baseColor={base} highlightColor={highlight} />
      </View>

      {/* Footer: two buttons */}
      <View style={[s.footerRow, { borderTopColor: colors.borderLight }]}>
        <Shimmer width="48%" height={36} radius={10} baseColor={base} highlightColor={highlight} />
        <Shimmer width="48%" height={36} radius={10} baseColor={base} highlightColor={highlight} />
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
});
