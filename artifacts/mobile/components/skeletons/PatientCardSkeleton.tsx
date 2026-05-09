import React from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Shimmer } from "@/components/ui/Shimmer";
import { useTheme } from "@/hooks/useTheme";

export function PatientCardSkeleton() {
  const { colors } = useTheme();
  const base = colors.border;
  const highlight = colors.card;

  return (
    <Card style={s.card}>
      {/* Header row: avatar + name + id + status */}
      <View style={s.row}>
        <Shimmer width={50} height={50} radius={25} baseColor={base} highlightColor={highlight} />
        <View style={s.info}>
          <Shimmer width="70%" height={16} baseColor={base} highlightColor={highlight} />
          <Shimmer width="45%" height={13} baseColor={base} highlightColor={highlight} />
        </View>
        <Shimmer width={60} height={20} radius={10} baseColor={base} highlightColor={highlight} />
      </View>

      {/* Meta grid: MRN + DOB */}
      <View style={[s.metaGrid, { borderTopColor: colors.borderLight }]}>
        <Shimmer width="48%" height={14} baseColor={base} highlightColor={highlight} />
        <Shimmer width="48%" height={14} baseColor={base} highlightColor={highlight} />
      </View>

      {/* Footer row: last visit + action buttons */}
      <View style={[s.footerRow, { borderTopColor: colors.borderLight }]}>
        <Shimmer width={130} height={12} baseColor={base} highlightColor={highlight} />
        <View style={s.actions}>
          <Shimmer width={32} height={32} radius={8} baseColor={base} highlightColor={highlight} />
          <Shimmer width={32} height={32} radius={8} baseColor={base} highlightColor={highlight} />
          <Shimmer width={90} height={32} radius={8} baseColor={base} highlightColor={highlight} />
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { flex: 1, gap: 6 },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  actions: { flexDirection: "row", gap: 8 },
});
