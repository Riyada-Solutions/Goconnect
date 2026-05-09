import React from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Shimmer } from "@/components/ui/Shimmer";
import { useTheme } from "@/hooks/useTheme";

export function SlotCardSkeleton() {
  const { colors } = useTheme();
  const base = colors.border;
  const highlight = colors.card;

  return (
    <Card style={s.card}>
      <View style={s.row}>
        <View style={s.timeCol}>
          <Shimmer width={48} height={18} baseColor={base} highlightColor={highlight} />
          <Shimmer width={40} height={12} baseColor={base} highlightColor={highlight} />
        </View>
        <View style={[s.colorBar, { backgroundColor: base }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={s.patientRow}>
            <Shimmer width={32} height={32} radius={16} baseColor={base} highlightColor={highlight} />
            <View style={{ flex: 1, gap: 5 }}>
              <Shimmer width="75%" height={14} baseColor={base} highlightColor={highlight} />
              <Shimmer width="55%" height={12} baseColor={base} highlightColor={highlight} />
            </View>
          </View>
          <View style={s.badgeRow}>
            <Shimmer width={70} height={20} radius={10} baseColor={base} highlightColor={highlight} />
            <Shimmer width={60} height={20} radius={10} baseColor={base} highlightColor={highlight} />
          </View>
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { padding: 14 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  timeCol: { width: 56, gap: 4, paddingTop: 2 },
  colorBar: { width: 3, alignSelf: "stretch", borderRadius: 2 },
  patientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 2 },
});
