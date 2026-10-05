import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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

function TestRow({ item, colors, isAbnormal }: { item: LabTestResult; colors: any; isAbnormal?: boolean }) {
  const valueColor = item.isAbnormal ? colors.error : colors.text;

  return (
    <View style={[s.tableRow, { borderBottomColor: colors.borderLight }]}>
      <Text style={[s.cell, s.testName, { color: colors.text, flex: 3 }]} numberOfLines={2}>
        {item.testName}
      </Text>
      <Text style={[s.cell, { color: valueColor, flex: 1 }]} numberOfLines={1}>
        {item.value}
      </Text>
      <Text style={[s.cell, { color: colors.textSecondary, flex: 0.8 }]} numberOfLines={1}>
        {item.isAbnormal ? "⚠" : "-"}
      </Text>
      <Text style={[s.cell, { color: colors.textSecondary, flex: 0.8 }]} numberOfLines={1}>
        -
      </Text>
      <Text style={[s.cell, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
        {item.unit && item.unit !== "--" ? item.unit : "-"}
      </Text>
      <Text style={[s.cell, { color: colors.textSecondary, flex: 1.2 }]} numberOfLines={1}>
        {item.referenceRange || "-"}
      </Text>
    </View>
  );
}

export function LabTestsSection({ results }: LabTestsSectionProps) {
  const { t } = useApp();
  const { colors } = useTheme();

  return (
    <View style={s.section}>
      {results.length === 0 ? (
        <Text style={[s.empty, { color: colors.textSecondary }]}>{t("noTestResults")}</Text>
      ) : (
        groupByCategory(results, t("other")).map(([category, rows]) => (
          <View key={category} style={s.categoryGroup}>
            <Text style={[s.categoryTitle, { color: Colors.primary, backgroundColor: colors.surface }]}>
              {category.toUpperCase()}
            </Text>

            {/* Table Headers */}
            <View style={[s.tableHeader, { backgroundColor: colors.borderLight }]}>
              <Text style={[s.headerCell, s.testName, { flex: 3 }]}>{t("testName") || "Test"}</Text>
              <Text style={[s.headerCell, { flex: 1 }]}>Result</Text>
              <Text style={[s.headerCell, { flex: 0.8 }]}>Flag</Text>
              <Text style={[s.headerCell, { flex: 0.8 }]}>Init</Text>
              <Text style={[s.headerCell, { flex: 1 }]}>Unit</Text>
              <Text style={[s.headerCell, { flex: 1.2 }]}>Ref Range</Text>
            </View>

            {/* Table Rows */}
            {rows.map((r) => (
              <TestRow key={r.id} item={r} colors={colors} />
            ))}
          </View>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 12 },
  categoryGroup: { marginBottom: 8 },
  categoryTitle: { fontSize: 12, fontFamily: "Inter_700Bold", paddingHorizontal: 12, paddingVertical: 8 },
  tableHeader: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 6 },
  headerCell: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center", paddingHorizontal: 4 },
  testName: { textAlign: "left", paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 6, alignItems: "center", borderBottomWidth: 1 },
  cell: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 4 },
  empty: { fontSize: 13, fontFamily: "Inter_400Regular", paddingVertical: 16, textAlign: "center" },
});
