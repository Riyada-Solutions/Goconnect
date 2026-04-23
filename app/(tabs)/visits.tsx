import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { ListSkeleton, VisitCardSkeleton } from "@/components/skeletons";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useVisits } from "@/hooks/useVisits";
import { useTheme } from "@/hooks/useTheme";

type VisitFilter =
  | "all"
  | "in_progress"
  | "start_procedure"
  | "end_procedure"
  | "completed";

const FILTERS: VisitFilter[] = [
  "all",
  "in_progress",
  "start_procedure",
  "end_procedure",
  "completed",
];

const FILTER_LABELS: Record<VisitFilter, string> = {
  all: "All",
  in_progress: "In Progress",
  start_procedure: "Start Procedure",
  end_procedure: "End Procedure",
  completed: "Completed",
};

const VISIT_TYPE_ICONS: Record<string, string> = {
  "Home Visit": "home",
  "Clinic Visit": "activity",
  "Follow-up": "repeat",
  Emergency: "alert-triangle",
};

export default function VisitsScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad, horizontal, listGap } = useScreenPadding({ hasTabBar: true });
  const [activeFilter, setActiveFilter] = useState<VisitFilter>("all");
  const { data: visits = [], isLoading, isError, refetch } = useVisits();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const showSkeleton = isLoading || refreshing;

  const filtered = useMemo(() => {
    if (activeFilter === "all") return visits;
    return visits.filter((v) => v.status === activeFilter);
  }, [visits, activeFilter]);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      {showSkeleton ? (
        <ListSkeleton
          count={10}
          renderItem={() => <VisitCardSkeleton />}
          style={{ paddingBottom: botPad }}
        />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          filtered.length === 0
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
        renderItem={({ item, index }) => {
          const icon =
            (VISIT_TYPE_ICONS[item.type] as any) ?? "activity";
          return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
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
                  <View style={styles.visitRow}>
                    {/* Type icon */}
                    <View
                      style={[
                        styles.typeIcon,
                        {
                          backgroundColor:
                            item.status === "completed"
                              ? "#EEF2FF"
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
                        >
                          {item.patientName}
                        </Text>
                        <StatusBadge status={item.status} size="sm" />
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
                        {item.time && (
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
                        )}
                        {item.duration && (
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
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Provider */}
                  <View
                    style={[
                      styles.providerRow,
                      { borderTopColor: colors.borderLight },
                    ]}
                  >
                    <Avatar name={item.provider} size={22} />
                    <Text
                      style={[
                        styles.providerName,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.provider}
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={14}
                      color={colors.textTertiary}
                    />
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
    borderTopWidth: 1,
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
