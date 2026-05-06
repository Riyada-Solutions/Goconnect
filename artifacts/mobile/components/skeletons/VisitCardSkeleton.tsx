import React from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Shimmer } from "@/components/ui/Shimmer";
import { useTheme } from "@/hooks/useTheme";

export function VisitCardSkeleton() {
  const { colors } = useTheme();
  const base = colors.border;
  const highlight = colors.card;

  return (
    <Card style={s.card}>
      <View style={s.row}>
        <Shimmer width={44} height={44} radius={12} baseColor={base} highlightColor={highlight} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={s.topRow}>
            <Shimmer width="55%" height={15} baseColor={base} highlightColor={highlight} />
            <Shimmer width={70} height={20} radius={10} baseColor={base} highlightColor={highlight} />
          </View>
          <Shimmer width="40%" height={12} baseColor={base} highlightColor={highlight} />
          <View style={s.metaRow}>
            <Shimmer width={60} height={11} baseColor={base} highlightColor={highlight} />
            <Shimmer width={50} height={11} baseColor={base} highlightColor={highlight} />
            <Shimmer width={55} height={11} baseColor={base} highlightColor={highlight} />
          </View>
        </View>
      </View>
      <View style={[s.footer, { borderTopColor: colors.borderLight }]}>
        <Shimmer width={22} height={22} radius={11} baseColor={base} highlightColor={highlight} />
        <Shimmer width={120} height={13} baseColor={base} highlightColor={highlight} />
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  row: { flexDirection: "row", gap: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
});
