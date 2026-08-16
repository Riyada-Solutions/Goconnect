import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { isEffectivelyOnline } from '@/context/NetworkContext'
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { GuestWall } from "@/components/ui/GuestWall";
import { PaginationList } from "@/components/common/PaginationList";
import { ScreenBackground } from "@/components/common/ScreenBackground";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ListSkeleton, VisitCardSkeleton } from "@/components/skeletons";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useTabRefresh } from "@/context/RefreshContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useVisits } from "@/hooks/useVisits";
import { useTheme } from "@/hooks/useTheme";

type VisitFilter = "in_progress" | "completed" | "all";

const FILTERS: VisitFilter[] = ["in_progress", "completed", "all"];


const VISIT_TYPE_ICONS: Record<string, string> = {
  "Home Visit": "home",
  "Clinic Visit": "activity",
  "Follow-up": "repeat",
  Emergency: "alert-triangle",
};

export default function VisitsScreen() {
  const { t, user } = useApp();
  const isGuest = !user || user.role === "guest";
  const { colors } = useTheme();
  const { onTabRefresh } = useTabRefresh();

  const FILTER_LABELS: Record<VisitFilter, string> = {
    all: t("all"),
    in_progress: t("visitFilterInProgress"),
    completed: t("completed"),
  };
  const { topPad, botPad, horizontal, listGap } = useScreenPadding({ hasTabBar: true });
  const [activeFilter, setActiveFilter] = useState<VisitFilter>("in_progress");
  // Backend filters by `status` directly now — "in progress" (with a space,
  // matching the API's own status value) and "completed" map straight
  // through; "all" omits the param entirely (see getVisitsPage).
  const STATUS_PARAM = useMemo(() => ({
    in_progress: "in progress" as const,
    completed: "completed" as const,
    all: undefined,
  }), []);
  const {
    data: pagesData,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVisits(undefined, STATUS_PARAM[activeFilter]);
  const filtered = useMemo(() => {
    const all = pagesData?.pages.flatMap((p) => p.items) ?? [];
    const seen = new Set<string>();
    return all.filter((v) => {
      const k = String(v.id);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [pagesData]);
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const showSkeleton = isLoading || refreshing;

  // If we have data, never show error even if isError is true (fallback/cache recovery)
  const shouldShowError = isError && !filtered.length;

  // Tap-to-refresh: refresh when visits tab is tapped
  useEffect(() => {
    const unsubscribe = onTabRefresh(async () => {
      const isOnline = await isEffectivelyOnline()
      if (isOnline) {
        refetch()
      }
    })
    return unsubscribe
  }, [onTabRefresh, refetch])

  // Refresh data when screen comes into focus (e.g., returning from visit detail)
  const queryClient = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      const refreshOnFocus = async () => {
        const isOnline = await isEffectivelyOnline()
        if (isOnline) {
          queryClient.invalidateQueries({ queryKey: ["visits"] });
          await refetch()
        }
      }
      refreshOnFocus()
    }, [queryClient, refetch])
  )

  React.useEffect(() => {
    console.log('[VisitsScreen] State:', {
      isLoading,
      isError,
      filteredLength: filtered.length,
      shouldShowError,
      hasData: !!pagesData?.pages,
    })
  }, [isLoading, isError, filtered.length, shouldShowError, pagesData])


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenBackground />
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("visitList")}
          </Text>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveFilter(f);
              }}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeFilter === f ? Colors.primary : colors.background,
                  borderColor:
                    activeFilter === f ? Colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === f ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                {FILTER_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isGuest ? <GuestWall>{null}</GuestWall> : showSkeleton ? (
        <ListSkeleton
          count={10}
          renderItem={() => <VisitCardSkeleton />}
          style={{ paddingBottom: botPad }}
        />
      ) : shouldShowError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <PaginationList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          refreshing={refreshing}
          onRefresh={onRefresh}
          itemGap={listGap}
          contentContainerStyle={
            filtered.length === 0
              ? { flexGrow: 1 }
              : { padding: horizontal, paddingBottom: botPad }
          }
          renderItem={({ item, index }: { item: any; index: number }) => {
            const icon =
              (VISIT_TYPE_ICONS[item.type] as any) ?? "activity";
            return (
              <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 50).springify()}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({
                      pathname: "/visits/[id]",
                      params: { id: item.id },
                    });
                  }}
                >
                  <Card style={styles.visitCard}>
                    {/* Footer row */}
                    <View
                      style={[
                        styles.providerRow,
                        { borderBottomColor: colors.borderLight },
                      ]}
                    >
                      {item.provider ? (
                        <Avatar name={item.provider} size={22} />
                      ) : (
                        <Feather name="hash" size={13} color={colors.textTertiary} />
                      )}
                      <Text
                        style={[
                          styles.providerName,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.provider ?? item.id}
                      </Text>
                      <StatusBadge status={item.status} size="sm" />

                      {/* <Feather
                      name="chevron-right"
                      size={14}
                      color={colors.textTertiary}
                    /> */}
                    </View>
     
             
                    <View style={styles.visitRow}>
                      {/* Type icon */}
                      <View
                        style={[
                          styles.typeIcon,
                          {
                            backgroundColor:
                              item.status === "completed"
                                ? "#EEF2FF"
                                : item.status === "reopened"
                                  ? "#F3E8FF"
                                  : item.status === "in_progress"
                                    ? "#E0F2FE"
                                    : item.status === "start_procedure"
                                      ? "#FFF7ED"
                                      : item.status === "end_procedure"
                                        ? "#FEF3C7"
                                        : Colors.accentLight,
                          },
                        ]}
                      >
                        <Feather
                          name={icon}
                          size={20}
                          color={
                            item.status === "completed"
                              ? "#4F46E5"
                              : item.status === "reopened"
                                ? "#7C3AED"
                                : item.status === "in_progress"
                                  ? "#0369A1"
                                  : item.status === "start_procedure"
                                    ? "#C2410C"
                                    : item.status === "end_procedure"
                                      ? "#92400E"
                                      : Colors.primary
                          }
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.visitTopRow}>
                          <Text
                            style={[styles.patientName, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {item.patientName ?? item.patient?.name}
                          </Text>
                          {/* <StatusBadge status={item.status} size="sm" /> */}
                        </View>
                        <Text
                          style={[
                            styles.visitType,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.type}
                        </Text>
                        <View style={styles.visitMeta}>
                          <View style={styles.metaItem}>
                            <Feather
                              name="calendar"
                              size={11}
                              color={colors.textTertiary}
                            />
                            <Text
                              style={[
                                styles.metaText,
                                { color: colors.textTertiary },
                              ]}
                            >
                              {item.date}
                            </Text>
                          </View>
                          {item.time ? (
                            <View style={styles.metaItem}>
                              <Feather
                                name="clock"
                                size={11}
                                color={colors.textTertiary}
                              />
                              <Text
                                style={[
                                  styles.metaText,
                                  { color: colors.textTertiary },
                                ]}
                              >
                                {item.time}
                              </Text>
                            </View>
                          ) : null}
                          {item.duration ? (
                            <View style={styles.metaItem}>
                              <Feather
                                name="activity"
                                size={11}
                                color={colors.textTertiary}
                              />
                              <Text
                                style={[
                                  styles.metaText,
                                  { color: colors.textTertiary },
                                ]}
                              >
                                {item.duration}min
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>


                  </Card>
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="activity"
              title={t("noVisits")}
              description={t("noVisitsDescription")}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  filters: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  visitCard: {
    padding: 0,
    overflow: "hidden",
  },
  visitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  visitTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  patientName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  visitType: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  visitMeta: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  providerName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
