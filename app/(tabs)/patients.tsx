import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PatientCard } from "@/components/common/PatientCard";
import { ScreenBackground } from "@/components/common/ScreenBackground";
import { SearchBar } from "@/components/common/SearchBar";
import { ListSkeleton, PatientCardSkeleton } from "@/components/skeletons";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { usePatients } from "@/hooks/usePatients";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";

type FilterStatus = "all" | "active" | "inactive";

const FILTERS: FilterStatus[] = ["all", "active", "inactive"];

export default function PatientsScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad, horizontal, listGap } = useScreenPadding({ hasTabBar: true });
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const { data: patients = [], isLoading, isError, refetch } = usePatients();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const showSkeleton = isLoading || refreshing;

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(q) ||
        (p.diagnosis?.toLowerCase().includes(q) ?? false) ||
        (p.patientId?.toLowerCase().includes(q) ?? false) ||
        (p.mrn?.toLowerCase().includes(q) ?? false);
      const matchesFilter =
        activeFilter === "all" || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [patients, search, activeFilter]);


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
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("patientList")}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t("searchPatients")}
        />

        {/* Filter Pills */}
        <View style={styles.filters}>
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
                    color: activeFilter === f ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                {t(f as any)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {showSkeleton ? (
        <ListSkeleton
          count={10}
          renderItem={() => <PatientCardSkeleton />}
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
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <PatientCard patient={item} />
            </Animated.View>
          )}
          ListEmptyComponent={
            patients.length === 0 ? (
              <EmptyState
                variant="empty"
                icon="users"
                title={t("noPatientsYet")}
                description={t("noPatientsDescription")}
              />
            ) : (
              <EmptyState
                variant="search"
                icon="search"
                title={t("noMatchingPatients")}
                description={t("noMatchingPatientsDescription")}
                actionLabel={t("clearFilters")}
                onAction={() => {
                  setSearch("");
                  setActiveFilter("all");
                }}
              />
            )
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
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
