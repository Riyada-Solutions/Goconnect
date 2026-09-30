import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/common/Card";
import { useApp } from "@/context/AppContext";
import type { LabTestResult } from "@/data/models/labResult";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

interface LabTestsSectionProps {
  results: LabTestResult[];
}

/** Groups rows by `category`, keeping the order the backend sent them in. */
function groupByCategory(results: LabTestResult[], otherLabel: string) {
  const groups = new Map<string, LabTestResult[]>();
  for (const r of results) {
    const key = r.category?.trim() || otherLabel;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.entries()];
}

function TestRow({ item }: { item: LabTestResult }) {
  const { t } = useApp();
  const { colors } = useTheme();
  const valueColor = item.isAbnormal ? colors.error : colors.text;
  const extra = [item.description, item.notes].filter(Boolean).join(" · ");

  return (
    <View style={[s.row, { borderTopColor: colors.borderLight }]}>
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

export function LabTestsSection({ results }: LabTestsSectionProps) {
  const { t } = useApp();
  const { colors } = useTheme();

  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{t("testResults")}</Text>
      <Card style={s.card}>
        {results.length === 0 ? (
          <Text style={[s.empty, { color: colors.textSecondary }]}>{t("noTestResults")}</Text>
        ) : (
          groupByCategory(results, t("other")).map(([category, rows]) => (
            <View key={category}>
              <Text style={[s.category, { color: Colors.primary }]}>{category.toUpperCase()}</Text>
              {rows.map((r) => (
                <TestRow key={r.id} item={r} />
              ))}
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { paddingHorizontal: 14, paddingVertical: 6 },
  category: { fontSize: 12, fontFamily: "Inter_700Bold", paddingTop: 10, paddingBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  nameCol: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  value: { fontSize: 15, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 12, textAlign: "center" },
});
