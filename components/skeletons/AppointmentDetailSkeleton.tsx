import React from "react";
import { StyleSheet, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Shimmer } from "@/components/ui/Shimmer";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/theme/spacing";

export function AppointmentDetailSkeleton() {
  const { colors } = useTheme();
  const { topPad } = useScreenPadding({ hasActionBar: true });
  const base = colors.border;
  const highlight = colors.card;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Shimmer width={40} height={40} radius={20} baseColor={base} highlightColor={highlight} />
        <Shimmer width={180} height={20} baseColor={base} highlightColor={highlight} />
      </View>

      <View style={{ padding: Spacing.screen.horizontal, gap: Spacing.screen.gap }}>
        {/* Patient card */}
        <Card style={{ padding: 14, gap: 10 }}>
          <View style={s.row}>
            <Shimmer width={50} height={50} radius={25} baseColor={base} highlightColor={highlight} />
            <View style={{ flex: 1, gap: 6 }}>
              <Shimmer width="70%" height={16} baseColor={base} highlightColor={highlight} />
              <Shimmer width="45%" height={13} baseColor={base} highlightColor={highlight} />
            </View>
            <Shimmer width={60} height={20} radius={10} baseColor={base} highlightColor={highlight} />
          </View>
          <View style={[s.metaGrid, { borderTopColor: colors.borderLight }]}>
            <Shimmer width="48%" height={14} baseColor={base} highlightColor={highlight} />
            <Shimmer width="48%" height={14} baseColor={base} highlightColor={highlight} />
          </View>
        </Card>

        {/* Summary card */}
        <Card style={{ padding: 16, gap: 12 }}>
          <Shimmer width={90} height={24} radius={12} baseColor={base} highlightColor={highlight} />
          <Shimmer width="60%" height={22} baseColor={base} highlightColor={highlight} />
          <Shimmer width="80%" height={14} baseColor={base} highlightColor={highlight} />
          <View style={s.infoGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={s.infoItem}>
                <Shimmer width="40%" height={11} baseColor={base} highlightColor={highlight} />
                <Shimmer width="80%" height={13} baseColor={base} highlightColor={highlight} />
              </View>
            ))}
          </View>
        </Card>

        {/* Care Team */}
        <Card style={{ padding: 14, gap: 10 }}>
          <Shimmer width={120} height={15} baseColor={base} highlightColor={highlight} />
          <View style={s.row}>
            <Shimmer width={44} height={44} radius={22} baseColor={base} highlightColor={highlight} />
            <View style={{ flex: 1, gap: 5 }}>
              <Shimmer width="55%" height={14} baseColor={base} highlightColor={highlight} />
              <Shimmer width={90} height={14} radius={6} baseColor={base} highlightColor={highlight} />
            </View>
          </View>
          <View style={s.row}>
            <Shimmer width={40} height={40} radius={20} baseColor={base} highlightColor={highlight} />
            <View style={{ flex: 1, gap: 5 }}>
              <Shimmer width="45%" height={13} baseColor={base} highlightColor={highlight} />
              <Shimmer width={70} height={12} radius={6} baseColor={base} highlightColor={highlight} />
            </View>
          </View>
        </Card>
      </View>
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
    gap: 12,
    borderBottomWidth: 1,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoItem: { width: "46%", gap: 6 },
});
