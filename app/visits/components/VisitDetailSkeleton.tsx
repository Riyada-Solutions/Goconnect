import React from "react";
import { ScrollView, View } from "react-native";

import { Shimmer } from "@/components/ui/Shimmer";

interface Props {
  colors: any;
}

export function VisitDetailSkeleton({ colors }: Props) {
  const B = colors.border;
  const H = colors.card;
  const bg = `${colors.card}B3`;

  return (
    <ScrollView
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* ── 1. Patient Card ─────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 14 }}>
        <View style={shell(bg, B, { padding: 14, gap: 10 })}>
          {/* Avatar + name + status badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Shimmer width={50} height={50} radius={25} baseColor={B} highlightColor={H} />
            <View style={{ flex: 1, gap: 5 }}>
              <Shimmer width="58%" height={16} baseColor={B} highlightColor={H} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Shimmer width={11} height={11} radius={3} baseColor={B} highlightColor={H} />
                <Shimmer width="40%" height={13} baseColor={B} highlightColor={H} />
              </View>
            </View>
            <Shimmer width={56} height={22} radius={11} baseColor={B} highlightColor={H} />
          </View>

          {/* MRN / DOB meta grid */}
          <View style={{
            flexDirection: "row", flexWrap: "wrap", gap: 8,
            paddingTop: 10, marginTop: 0,
            borderTopWidth: 1, borderTopColor: B,
          }}>
            {[0, 1].map(i => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4, flexBasis: "47%", flexGrow: 1 }}>
                <Shimmer width={11} height={11} radius={3} baseColor={B} highlightColor={H} />
                <Shimmer width={26} height={11} baseColor={B} highlightColor={H} />
                <Shimmer width="44%" height={12} baseColor={B} highlightColor={H} />
              </View>
            ))}
          </View>

          {/* Footer: last visit label + 3 action buttons */}
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingTop: 10, borderTopWidth: 1, borderTopColor: B,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Shimmer width={12} height={12} radius={3} baseColor={B} highlightColor={H} />
              <Shimmer width={115} height={12} baseColor={B} highlightColor={H} />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Shimmer width={32} height={32} radius={10} baseColor={B} highlightColor={H} />
              <Shimmer width={32} height={32} radius={10} baseColor={B} highlightColor={H} />
              <Shimmer width={32} height={32} radius={10} baseColor={B} highlightColor={H} />
            </View>
          </View>
        </View>
      </View>

      {/* ── Section Header: Visit Info ─────────────────────────── */}
      <SectionHeaderSkel width="28%" B={B} H={H} />

      {/* ── 2. Visit Info Card ─────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
        <View style={shell(bg, B, { padding: 14 })}>
          {/* Row 1: Date | Procedure Time | Visit Time */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[0, 1, 2].map(i => (
              <View key={i} style={{ flex: 1, gap: 4 }}>
                <Shimmer width="75%" height={11} baseColor={B} highlightColor={H} />
                <Shimmer width="55%" height={14} baseColor={B} highlightColor={H} />
              </View>
            ))}
          </View>

          <View style={{ height: 1, backgroundColor: B, marginVertical: 10 }} />

          {/* Row 2: Status badge | Patient | Hospital */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Shimmer width="50%" height={11} baseColor={B} highlightColor={H} />
              <Shimmer width={70} height={24} radius={12} baseColor={B} highlightColor={H} />
            </View>
            {[0, 1].map(i => (
              <View key={i} style={{ flex: 1, gap: 4 }}>
                <Shimmer width="65%" height={11} baseColor={B} highlightColor={H} />
                <Shimmer width="55%" height={14} baseColor={B} highlightColor={H} />
              </View>
            ))}
          </View>

          <View style={{ height: 1, backgroundColor: B, marginVertical: 10 }} />

          {/* Row 3: Insurance | Provider | Doctor Time */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[0, 1, 2].map(i => (
              <View key={i} style={{ flex: 1, gap: 4 }}>
                <Shimmer width="70%" height={11} baseColor={B} highlightColor={H} />
                <Shimmer width="52%" height={14} baseColor={B} highlightColor={H} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── 3. Care Team Card ──────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
        <View style={shell(bg, B, { padding: 14 })}>
          <Shimmer width="30%" height={15} baseColor={B} highlightColor={H} style={{ marginBottom: 8 }} />
          {[0, 1].map(i => (
            <View key={i} style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              paddingVertical: 7,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: B,
            }}>
              <Shimmer width={36} height={36} radius={18} baseColor={B} highlightColor={H} />
              <View style={{ flex: 1, gap: 5 }}>
                <Shimmer width="52%" height={14} baseColor={B} highlightColor={H} />
                <Shimmer width="38%" height={12} baseColor={B} highlightColor={H} />
              </View>
              <Shimmer width={58} height={20} radius={10} baseColor={B} highlightColor={H} />
            </View>
          ))}
        </View>
      </View>

      {/* ── Section Header: Forms ──────────────────────────────── */}
      <SectionHeaderSkel width="18%" B={B} H={H} />

      {/* ── 4–9. Collapsible form section bars ─────────────────── */}
      {(["56%", "46%", "40%", "52%", "44%", "48%"] as const).map((w, i) => (
        <View key={i} style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <View style={shell(bg, B, { padding: 0 })}>
            <View style={{
              flexDirection: "row", alignItems: "center",
              justifyContent: "space-between", padding: 14,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Shimmer width={30} height={30} radius={8} baseColor={B} highlightColor={H} />
                <Shimmer width={w} height={14} baseColor={B} highlightColor={H} />
              </View>
              <Shimmer width={18} height={18} radius={4} baseColor={B} highlightColor={H} />
            </View>
          </View>
        </View>
      ))}

      {/* ── 10. Workflow action button ─────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Shimmer width="100%" height={52} radius={14} baseColor={B} highlightColor={H} />
      </View>
    </ScrollView>
  );
}

function shell(bg: string, border: string, extra?: object) {
  return {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: bg,
    ...extra,
  };
}

function SectionHeaderSkel({ width, B, H }: { width: string; B: string; H: string }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 10 }}>
      <Shimmer width={width} height={15} baseColor={B} highlightColor={H} />
    </View>
  );
}
