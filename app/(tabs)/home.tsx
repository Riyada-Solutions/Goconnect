import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppBarBackground from "@/assets/svg/appbar-background.svg";
import BackgroundCare from "@/assets/svg/background-care.svg";
import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { PatientCard } from "@/components/common/PatientCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useDashboardStats } from "@/hooks/useHome";
import { usePatients } from "@/hooks/usePatients";
import { useVisits } from "@/hooks/useVisits";
import { useTheme } from "@/hooks/useTheme";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 17) return "goodAfternoon";
  return "goodEvening";
}

export default function HomeScreen() {
  const { user, t } = useApp();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const greetingKey = getGreeting() as
    | "goodMorning"
    | "goodAfternoon"
    | "goodEvening";

  const { data: stats } = useDashboardStats();
  const { data: visits = [] } = useVisits();
  const { data: patients = [] } = usePatients();

  const todayVisits = visits.slice(0, 3);
  const recentPatients = patients.slice(0, 4);

  const STAT_CARDS = [
    {
      label: "totalPatients",
      value: stats?.totalPatients ?? 0,
      icon: "users",
      iconLib: "feather" as const,
      color: Colors.primary,
      bg: "#E8F5F7",
    },
    {
      label: "todayVisits",
      value: stats?.todayVisits ?? 0,
      icon: "stethoscope",
      iconLib: "mci" as const,
      color: "#6366F1",
      bg: "#EEF2FF",
    },
    {
      label: "completedVisits",
      value: stats?.completedVisits ?? 0,
      icon: "check-circle",
      iconLib: "feather" as const,
      color: "#10B981",
      bg: "#E8FDF5",
    },
    {
      label: "pendingSchedules",
      value: stats?.pendingSchedules ?? 0,
      icon: "clock",
      iconLib: "feather" as const,
      color: "#F59E0B",
      bg: "#FEF9C3",
    },
  ];

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 84);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.screenBg} pointerEvents="none">
        <BackgroundCare
          width="70%"
          height="70%"

          preserveAspectRatio="xMaxYMid slice"
        />
        <LinearGradient
          colors={[
            colors.background,
            `${colors.background}00`,
            `${colors.background}00`,
            colors.background,
          ]}
          locations={[0, 0.18, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    <ScrollView
      style={{ flex: 1, backgroundColor: "transparent" }}
      contentContainerStyle={{ paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={
          isDark
            ? ["#0B7B8B", "#0A1628"]
            : [Colors.primary, Colors.primaryDark]
        }
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerBg} pointerEvents="none">
          <AppBarBackground
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
          />
          <LinearGradient
            colors={[
              "rgba(45,170,174,0.55)",
              "rgba(45,170,174,0)",
              "rgba(45,170,174,0)",
              "rgba(15,98,108,0.85)",
            ]}
            locations={[0, 0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t(greetingKey)}</Text>
            <Text style={styles.userName}>{user?.name ?? "Doctor"}</Text>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Bell */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/notifications");
              }}
              style={styles.bellBtn}
            >
              <Feather name="bell" size={22} color="#fff" />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>3</Text>
              </View>
            </Pressable>
            {/* Avatar / Settings */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(settings)");
              }}
            >
              <View style={styles.settingsWrapper}>
                <Avatar name={user?.name} size={48} />
                <View style={styles.settingsDot}>
                  <Feather name="settings" size={10} color="#fff" />
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Stats Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          {STAT_CARDS.map((s, i) => (
            <Animated.View
              key={s.label}
              entering={FadeInRight.delay(i * 80).springify()}
            >
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
              >
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  {s.iconLib === "mci" ? (
                    <MaterialCommunityIcons
                      name={s.icon as any}
                      size={18}
                      color="#fff"
                    />
                  ) : (
                    <Feather name={s.icon as any} size={18} color="#fff" />
                  )}
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{t(s.label as any)}</Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Upcoming Visits */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("upcomingVisits")}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/visits");
            }}
          >
            <Text style={[styles.viewAll, { color: Colors.primary }]}>
              {t("viewAll")}
            </Text>
          </Pressable>
        </View>

        {todayVisits.map((visit, i) => (
          <Animated.View
            key={visit.id}
            entering={FadeInDown.delay(i * 80).springify()}
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: "/visits/[id]",
                  params: { id: visit.id },
                });
              }}
            >
              <Card style={styles.visitCard}>
                <View style={styles.visitCardRow}>
                  <View
                    style={[
                      styles.visitTimeBox,
                      { backgroundColor: Colors.accentLight },
                    ]}
                  >
                    <Text
                      style={[styles.visitTime, { color: Colors.primaryDark }]}
                    >
                      {visit.time}
                    </Text>
                    <Text
                      style={[
                        styles.visitDuration,
                        { color: Colors.primaryDark },
                      ]}
                    >
                      {visit.duration}m
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.visitPatient, { color: colors.text }]}>
                      {visit.patientName}
                    </Text>
                    <Text
                      style={[
                        styles.visitProvider,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {visit.type}
                    </Text>
                    <Text
                      style={[
                        styles.visitAddress,
                        { color: colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {visit.address}
                    </Text>
                  </View>
                  <StatusBadge status={visit.status} size="sm" />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Recent Patients */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("recentPatients")}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/patients");
            }}
          >
            <Text style={[styles.viewAll, { color: Colors.primary }]}>
              {t("viewAll")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.patientList}>
          {recentPatients.map((p, i) => (
            <Animated.View
              key={p.id}
              entering={FadeInDown.delay(100 + i * 60).springify()}
            >
              <PatientCard patient={p} />
            </Animated.View>
          ))}
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: "hidden",
  },
  screenBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    // opacity: 1,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  userName: {
    fontSize: 22,
    color: "#fff",
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
  },
  roleText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellBtn: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
  },
  bellBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  settingsWrapper: {
    position: "relative",
  },
  settingsDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
  },
  statsScroll: {
    gap: 12,
    paddingRight: 20,
  },
  statCard: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    minWidth: 100,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  viewAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  visitCard: {
    marginBottom: 10,
    padding: 12,
  },
  visitCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  visitTimeBox: {
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    minWidth: 58,
  },
  visitTime: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  visitDuration: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  visitPatient: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  visitProvider: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  visitAddress: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  patientList: {
    gap: 12,
  },
});
