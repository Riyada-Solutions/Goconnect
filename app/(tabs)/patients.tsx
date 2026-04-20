import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { SearchBar } from "@/components/common/SearchBar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { usePatients } from "@/hooks/usePatients";
import { useTheme } from "@/hooks/useTheme";

type FilterStatus = "all" | "active" | "inactive" | "critical";

const FILTERS: FilterStatus[] = ["all", "active", "critical", "inactive"];

export default function PatientsScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const { data: patients = [], isLoading, isError, refetch } = usePatients();

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.diagnosis?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesFilter =
        activeFilter === "all" || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [patients, search, activeFilter]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 84);

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

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Failed to load patients</Text>
          <Pressable onPress={() => refetch()} style={{ padding: 10 }}>
            <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold" }}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: botPad,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: "/patients/[id]",
                  params: { id: item.id },
                });
              }}
            >
              <Card style={styles.patientCard}>
                <View style={styles.patientRow}>
                  <Avatar name={item.name} size={50} />
                  <View style={styles.patientInfo}>
                    <Text
                      style={[styles.patientName, { color: colors.text }]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.patientDiagnosis,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.diagnosis}
                    </Text>
                    <View style={styles.patientMeta}>
                      <Feather
                        name="phone"
                        size={11}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.patientPhone,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {item.phone}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.patientRight}>
                    <StatusBadge status={item.status} size="sm" />
                    <View style={styles.lastVisitRow}>
                      <Feather
                        name="calendar"
                        size={11}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.lastVisit,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {item.lastVisit}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("noResults")}
            </Text>
          </View>
        }
      />
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
  patientCard: {
    padding: 14,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  patientInfo: {
    flex: 1,
    gap: 3,
  },
  patientName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  patientDiagnosis: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  patientMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  patientPhone: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  patientRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  lastVisitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lastVisit: {
    fontSize: 11,
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
