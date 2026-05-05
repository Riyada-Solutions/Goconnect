import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ActionButton } from "@/components/common/ActionButton";
import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { CareTeamView } from "@/components/common/CareTeamView";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SectionHeader } from "@/components/common/SectionHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PatientDetailSkeleton } from "@/components/skeletons";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { usePatient } from "@/hooks/usePatients";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";

interface GridItemProps {
  icon: string;
  label: string;
  value?: string;
  textColor: string;
  secondaryColor: string;
}

function GridItem({ icon, label, value, textColor, secondaryColor }: GridItemProps) {
  return (
    <View style={styles.gridItem}>
      <View style={styles.gridIcon}>
        <Feather name={icon as any} size={14} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.gridLabel, { color: secondaryColor }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.gridValue, { color: textColor }]} numberOfLines={1}>
          {value ?? "—"}
        </Text>
      </View>
    </View>
  );
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const { colors, isDark } = useTheme();
  const { topPad, botPad } = useScreenPadding();

  const { data: patient, isLoading, isError, refetch } = usePatient(Number(id));
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  // ── App-bar always visible — body switches between skeleton/error/empty/content ──
  const renderHeader = () => (
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
      <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>
        {t("patientDetails")}
      </Text>
      <View style={{ width: 38 }} />
    </View>
  );

  if (isLoading || refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <PatientDetailSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <EmptyState
          icon="user-x"
          title={t("patientNotFound")}
          description={t("patientNotFoundDescription")}
          actionLabel={t("goBack")}
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Hero Card */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View
            style={[
              styles.heroCard,
              { backgroundColor: isDark ? Colors.dark.card : "#fff" },
            ]}
          >
            <Avatar name={patient.name} imageUrl={patient.avatarUrl} size={72} />
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: colors.text }]}>
                {patient.name}
              </Text>
              <View style={styles.heroIdRow}>
                <Feather name="hash" size={12} color={colors.textTertiary} />
                <Text
                  style={[styles.heroIdText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {patient.patientId}
                </Text>
              </View>
              <View style={styles.heroBadgeRow}>
                <StatusBadge status={patient.status} />
                {patient.bloodType && (
                  <View
                    style={[
                      styles.bloodType,
                      { backgroundColor: "#FFF1F1" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="blood-bag"
                      size={12}
                      color="#EF4444"
                    />
                    <Text style={styles.bloodTypeText}>
                      {patient.bloodType}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Patient Demographics */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{ paddingHorizontal: 16, marginTop: 16 }}
        >
          <SectionHeader
            title={t("patientDemographics")}
            trailing={
              <>
                {patient.phone ? (
                  <ActionButton type="call" value={patient.phone} />
                ) : null}
                {patient.address ? (
                  <ActionButton type="location" value={patient.address} />
                ) : null}
                <ActionButton type="labResults" value={patient.id} />
              </>
            }
          />
          <Card style={styles.sectionCard}>
            <View style={styles.grid}>
              <GridItem
                icon="hash"
                label={t("patientId")}
                value={patient.patientId}
                textColor={colors.text}
                secondaryColor={colors.textSecondary}
              />
              <GridItem
                icon="file-text"
                label={t("mrn")}
                value={patient.mrn}
                textColor={colors.text}
                secondaryColor={colors.textSecondary}
              />
              <GridItem
                icon="calendar"
                label={t("dob")}
                value={patient.dob ?? undefined}
                textColor={colors.text}
                secondaryColor={colors.textSecondary}
              />
              <GridItem
                icon="user"
                label={t("gender")}
                value={patient.gender ?? undefined}
                textColor={colors.text}
                secondaryColor={colors.textSecondary}
              />
              <GridItem
                icon="shield"
                label={t("codeStatus")}
                value={patient.codeStatus ?? undefined}
                textColor={colors.text}
                secondaryColor={colors.textSecondary}
              />
              <GridItem
                icon="pause-circle"
                label={t("treatmentHoliday")}
                value={patient.treatmentHoliday ? t("yes") : t("no")}
                textColor={colors.text}
                secondaryColor={colors.textSecondary}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Care Team */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <CareTeamView
            title={t("careTeam")}
            animDelay={150}
            members={patient.careTeam ?? []}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  topTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  heroName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  heroIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroIdText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  bloodType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bloodTypeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#DC2626",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  sectionCard: {
    marginTop: 8,
    padding: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
    columnGap: 8,
  },
  gridItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexBasis: "48%",
    flexGrow: 1,
  },
  gridIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 24,
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
