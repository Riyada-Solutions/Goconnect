import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { RuleGate } from "@/components/common/RuleGate";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LabResultCardSkeleton, ListSkeleton } from "@/components/skeletons";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import { useApp } from "@/context/AppContext";
import { useLabResults } from "@/hooks/useLabResults";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

export default function LabResultsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const pid = Number(patientId);
  const { t } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad, horizontal, listGap } = useScreenPadding();
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const { data: results = [], isLoading, isError, refetch } = useLabResults(pid);
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const showSkeleton = isLoading || refreshing;

  const openPdf = async (url?: string | null) => {
    if (!url) {
      showDialog({
        variant: "error",
        title: t("labResults"),
        message: t("noPdfAvailable"),
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
    } catch {
      showDialog({
        variant: "error",
        title: t("labResults"),
        message: t("pdfOpenFailed"),
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FeedbackDialog {...dialogProps} />

      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {t("labResults")}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{results.length}</Text>
        </View>
      </View>

      {showSkeleton ? (
        <ListSkeleton
          count={10}
          renderItem={() => <LabResultCardSkeleton />}
          style={{ paddingBottom: botPad }}
        />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={
            results.length === 0
              ? { flexGrow: 1 }
              : { padding: horizontal, paddingBottom: botPad, gap: listGap }
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <Card style={styles.itemCard}>
                {/* Header row: ID + status */}
                <View style={styles.headerRow}>
                  <View style={styles.idBadge}>
                    <Text style={[styles.idText, { color: Colors.primary }]}>
                      #{item.id}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} size="sm" />
                </View>

                {/* Lab company */}
                <Text style={[styles.labCompany, { color: colors.text }]}>
                  {item.labCompany}
                </Text>

                {/* Meta grid */}
                <View
                  style={[
                    styles.metaGrid,
                    { borderTopColor: colors.borderLight },
                  ]}
                >
                  <View style={styles.metaItem}>
                    <Feather name="user" size={11} color={colors.textTertiary} />
                    <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                      {t("addedBy")}
                    </Text>
                    <Text
                      style={[styles.metaValue, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.addedBy}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather
                      name="clock"
                      size={11}
                      color={colors.textTertiary}
                    />
                    <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                      {t("addedAt")}
                    </Text>
                    <Text
                      style={[styles.metaValue, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.addedAt}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather
                      name="calendar"
                      size={11}
                      color={colors.textTertiary}
                    />
                    <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                      {t("dueDate")}
                    </Text>
                    <Text
                      style={[styles.metaValue, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.dueDate}
                    </Text>
                  </View>
                </View>

                {/* Action row */}
                <View
                  style={[
                    styles.footerRow,
                    { borderTopColor: colors.borderLight },
                  ]}
                >
                  <RuleGate action="view_lab_order_pdf">
                    <Pressable
                      onPress={() => openPdf(item.labOrderPdfUrl)}
                      disabled={!item.labOrderPdfUrl}
                      style={[
                        styles.viewBtn,
                        {
                          backgroundColor: item.labOrderPdfUrl
                            ? Colors.primary
                            : colors.borderLight,
                        },
                      ]}
                    >
                      <Feather
                        name="clipboard"
                        size={14}
                        color={
                          item.labOrderPdfUrl ? "#fff" : colors.textTertiary
                        }
                      />
                      <Text
                        style={[
                          styles.viewText,
                          {
                            color: item.labOrderPdfUrl
                              ? "#fff"
                              : colors.textTertiary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {t("viewLabOrder")}
                      </Text>
                    </Pressable>
                  </RuleGate>

                  <RuleGate action="view_lab_result_pdf">
                    <Pressable
                      onPress={() => openPdf(item.resultPdfUrl)}
                      disabled={!item.resultPdfUrl}
                      style={[
                        styles.viewBtn,
                        {
                          backgroundColor: item.resultPdfUrl
                            ? Colors.primary
                            : colors.borderLight,
                        },
                      ]}
                    >
                      <Feather
                        name="file-text"
                        size={14}
                        color={item.resultPdfUrl ? "#fff" : colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.viewText,
                          {
                            color: item.resultPdfUrl
                              ? "#fff"
                              : colors.textTertiary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {t("viewLabResults")}
                      </Text>
                    </Pressable>
                  </RuleGate>
                </View>
              </Card>
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="file-text"
              title={t("noLabResults")}
              description={t("noLabResultsDescription")}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  countBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primaryDark,
  },
  itemCard: {
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  idBadge: {
    backgroundColor: `${Colors.primary}14`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  idText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  labCompany: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexBasis: "48%",
    flexGrow: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  metaValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  viewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
