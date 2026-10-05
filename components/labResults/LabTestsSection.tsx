import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Acc } from "@/components/visits/Acc";
import { useApp } from "@/context/AppContext";
import type { LabResultGroup, LabTestResult } from "@/data/models/labResult";
import { useTheme } from "@/hooks/useTheme";

interface LabTestsSectionProps {
  groups: LabResultGroup[];
  /** Skip the outer title/card when nested inside another section. */
  embedded?: boolean;
}

/** Accent colours cycled across groups, same family as the Flow Sheet sections. */
const GROUP_COLORS = ["#2DAAAE", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#0891B2", "#F97316"];

function TestRow({ item, first }: { item: LabTestResult; first: boolean }) {
  const { t } = useApp();
  const { colors } = useTheme();
  const valueColor = item.isAbnormal ? colors.error : colors.text;
  const extra = [item.description, item.notes].filter(Boolean).join(" · ");

  return (
    <View style={[s.row, { borderTopColor: colors.borderLight, borderTopWidth: first ? 0 : 1 }]}>
      <View style={s.nameCol}>
        <Text style={[s.name, { color: colors.text }]}>{item.testName}</Text>
        {item.referenceRange ? (
          <Text style={[s.sub, { color: colors.textSecondary }]}>
            {t("referenceRange")}: {item.referenceRange}
          </Text>
        ) : null}
        {extra ? <Text style={[s.sub, { color: colors.textSecondary }]}>{extra}</Text> : null}
      </View>
      <Text style={[s.value, { color: valueColor }]}>
        {item.value}
        {item.unit && item.unit !== "--" ? <Text style={[s.unit, { color: colors.textSecondary }]}> {item.unit}</Text> : null}
      </Text>
    </View>
  );
}

export function LabTestsSection({ groups, embedded }: LabTestsSectionProps) {
  const { t } = useApp();
  const { colors } = useTheme();
  const sorted = groups.filter((g) => g.results?.length).sort((a, b) => a.sort - b.sort);

  // First group starts open; the rest are collapsed like the Flow Sheet.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    sorted.length ? { [String(sorted[0].groupId)]: true } : {},
  );
  const toggle = useCallback((key: string) => setOpen((p) => ({ ...p, [key]: !p[key] })), []);

  const body =
    sorted.length === 0 ? (
      <Text style={[s.empty, { color: colors.textSecondary }]}>{t("noTestResults")}</Text>
    ) : (
      <View style={s.groups}>
        {sorted.map((group, i) => {
          const key = String(group.groupId);
          return (
            <Acc
              key={key}
              title={`${group.groupName?.trim() || t("other")} (${group.results.length})`}
              color={GROUP_COLORS[i % GROUP_COLORS.length]}
              done={false}
              isOpen={!!open[key]}
              onToggle={() => toggle(key)}
              colors={colors}
              style={s.acc}
            >
              {group.results.map((r, idx) => (
                <TestRow key={r.id} item={r} first={idx === 0} />
              ))}
            </Acc>
          );
        })}
      </View>
    );

  if (embedded) {
    return body;
  }

  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{t("testResults")}</Text>
      <Card style={s.card}>{body}</Card>
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { paddingHorizontal: 14, paddingVertical: 6 },
  groups: { gap: 10 },
  acc: { marginBottom: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  nameCol: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  value: { fontSize: 15, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 12, textAlign: "center" },
});
