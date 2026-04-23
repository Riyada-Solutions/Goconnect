import React from "react";
import { View } from "react-native";

import { Shimmer } from "@/components/ui/Shimmer";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { Spacing } from "@/theme/spacing";

import { visitDetailStyles as s } from "../visit-detail.styles";

interface Props {
  colors: any;
}

export function VisitDetailSkeleton({ colors }: Props) {
  const { topPad } = useScreenPadding({ hasActionBar: true });
  const baseColor = colors.border;
  const highlightColor = colors.card;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.topBar,
          { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Shimmer width={38} height={38} radius={10} baseColor={baseColor} highlightColor={highlightColor} />
        <Shimmer width={140} height={20} baseColor={baseColor} highlightColor={highlightColor} style={{ marginLeft: 8 }} />
      </View>

      <View style={{ padding: Spacing.screen.horizontal, gap: Spacing.screen.gap }}>
        {/* Hero */}
        <View style={[s.heroCard, { backgroundColor: colors.card, gap: 10 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Shimmer width={54} height={54} radius={27} baseColor={baseColor} highlightColor={highlightColor} />
            <View style={{ flex: 1, gap: 6 }}>
              <Shimmer width="70%" height={18} baseColor={baseColor} highlightColor={highlightColor} />
              <Shimmer width="50%" height={14} baseColor={baseColor} highlightColor={highlightColor} />
              <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
                <Shimmer width={70} height={18} radius={10} baseColor={baseColor} highlightColor={highlightColor} />
                <Shimmer width={50} height={18} radius={10} baseColor={baseColor} highlightColor={highlightColor} />
              </View>
            </View>
          </View>
        </View>

        {/* Visit Info card */}
        <SectionSkeleton baseColor={baseColor} highlightColor={highlightColor} rows={3} />
        {/* Alerts */}
        <SectionSkeleton baseColor={baseColor} highlightColor={highlightColor} rows={2} />
        {/* Care Team */}
        <SectionSkeleton baseColor={baseColor} highlightColor={highlightColor} rows={2} />
        {/* Flow Sheet header */}
        <SectionSkeleton baseColor={baseColor} highlightColor={highlightColor} rows={1} />
      </View>
    </View>
  );
}

function SectionSkeleton({
  baseColor,
  highlightColor,
  rows,
}: {
  baseColor: string;
  highlightColor: string;
  rows: number;
}) {
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: baseColor,
        gap: 10,
      }}
    >
      <Shimmer width="55%" height={16} baseColor={baseColor} highlightColor={highlightColor} />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 8 }}>
          <Shimmer width="30%" height={14} baseColor={baseColor} highlightColor={highlightColor} />
          <Shimmer width="60%" height={14} baseColor={baseColor} highlightColor={highlightColor} />
        </View>
      ))}
    </View>
  );
}
