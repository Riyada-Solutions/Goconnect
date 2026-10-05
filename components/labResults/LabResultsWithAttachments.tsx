import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { useApp } from "@/context/AppContext";
import type { LabDocument, LabResult, LabTestResult } from "@/data/models/labResult";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";
import { LabDocumentItem } from "./LabDocumentItem";
import { LabTestsSection } from "./LabTestsSection";

interface LabResultsWithAttachmentsProps {
  order: LabResult;
  onOpenImage: (uri: string) => void;
}

export function LabResultsWithAttachments({ order, onOpenImage }: LabResultsWithAttachmentsProps) {
  const { t, can } = useApp();
  const { colors } = useTheme();
  const [resultsExpanded, setResultsExpanded] = useState(true);

  const hasResults = (order.results ?? []).length > 0;
  const documents: Array<{ key: string; title: string; doc: LabDocument }> = [];

  if (order.resultPdfUrl && can("view_lab_result_pdf")) {
    documents.push({ key: "result", title: t("viewLabResults"), doc: { id: -1, url: order.resultPdfUrl } });
  }
  if (order.labOrderPdfUrl && can("view_lab_order_pdf")) {
    documents.push({ key: "order", title: t("viewLabOrder"), doc: { id: -2, url: order.labOrderPdfUrl } });
  }
  for (const doc of order.documents ?? []) {
    documents.push({ key: `doc-${doc.id}`, title: doc.fileName || t("document"), doc });
  }

  const hasDocuments = documents.length > 0;
  const hasContent = hasResults || hasDocuments;

  const toggleResults = () => {
    Haptics.selectionAsync();
    setResultsExpanded(!resultsExpanded);
  };

  if (!hasContent) {
    return (
      <Card style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[s.emptyText, { color: colors.textSecondary }]}>
          {t("noTestResults")}
        </Text>
      </Card>
    );
  }

  return (
    <View style={s.container}>
      {/* Test Results Section */}
      {hasResults && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Pressable
            onPress={toggleResults}
            style={[s.sectionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={s.headerContent}>
              <Feather
                name={resultsExpanded ? "chevron-down" : "chevron-right"}
                size={18}
                color={Colors.primary}
              />
              <Text style={[s.sectionTitle, { color: colors.text }]}>
                {t("testResults")}
              </Text>
              <View style={s.resultCount}>
                <Text style={s.countText}>{order.results?.length ?? 0}</Text>
              </View>
            </View>
          </Pressable>

          {resultsExpanded && (
            <View style={[s.resultsContent, { backgroundColor: colors.surface }]}>
              <LabTestsSection results={order.results ?? []} />
            </View>
          )}
        </Animated.View>
      )}

      {/* Attachments Section */}
      {hasDocuments && (
        <Animated.View entering={FadeInDown.delay(hasResults ? 60 : 0).duration(300)}>
          <View style={s.attachmentsSection}>
            <Text style={[s.attachmentsTitle, { color: colors.textSecondary }]}>
              {t("labDocuments")}
            </Text>
            <View style={s.documentsList}>
              {documents.map((e, idx) => (
                <View
                  key={e.key}
                  style={[
                    s.documentWrapper,
                    idx < documents.length - 1 && { borderBottomColor: colors.borderLight, borderBottomWidth: 1 },
                  ]}
                >
                  <LabDocumentItem doc={e.doc} title={e.title} onOpenImage={onOpenImage} />
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  resultCount: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primaryDark,
  },
  resultsContent: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  attachmentsSection: { gap: 8 },
  attachmentsTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  documentsList: { borderRadius: 12, overflow: "hidden" },
  documentWrapper: {},
  emptyCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
