import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
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
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { VisitCardSkeleton } from "@/components/skeletons/VisitCardSkeleton";
import { Shimmer } from "@/components/ui/Shimmer";
import { GuestWall } from "@/components/ui/GuestWall";
import { Colors } from "@/theme/colors";
import { useQueryClient } from "@tanstack/react-query";

import { useApp } from "@/context/AppContext";
import { useFreshOnFocus } from "@/hooks/useFreshOnFocus";
import { useHome } from "@/hooks/useHome";
import { useTheme } from "@/hooks/useTheme";
import { formatWorkspace } from "@/utils/workspace";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 17) return "goodAfternoon";
  return "goodEvening";
}

/** Appointment slots carry a raw 24h "HH:mm" string; visits are already
 *  formatted 12h with AM/PM. Match that format so both time boxes show the
 *  same shape of text (and therefore render at the same size). */
function formatTime12h(hhmm?: string | null): string {
  if (!hhmm) return "";
  const [hStr, mStr = "00"] = hhmm.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr.padStart(2, "0")} ${ampm}`;
}

/** Minutes between two "HH:mm" times, for the appointment time box's second
 *  line — matches the visit card's `{duration}m` so both boxes show the
 *  same kind of value instead of one showing a short "45m" and the other a
 *  full clock time like "10:45". */
function minutesBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : null;
}

export default function HomeScreen() {
  const { user, t } = useApp();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const greetingKey = getGreeting() as
    | "goodMorning"
    | "goodAfternoon"
    | "goodEvening";

  const { data: home, refetch: refetchHome, isFetching, isPending } = useHome();
  const qc = useQueryClient();
  // Opening Home online must never show yesterday's dashboard: drop the
  // cached `['home']` payload on focus so the screen goes back to skeletons
  // and only paints numbers that came from this fetch. The query client sets
  // `refetchOnMount: false` and persists its cache for 24h, so without this
  // the restored payload would sit there until a pull-to-refresh.
  useFreshOnFocus(["home"]);
  const [refreshing, setRefreshing] = useState(false);
  const workspaceLabel = formatWorkspace(user, t as (k: string) => string);
  // Pulling on Home should refresh everything the dashboard renders. The
  // `/dashboard` rollup covers stats, today's visits, appointments and the
  // notification count — but other tabs read the same data through separate
  // queries (`['visits']`, `['scheduler']`, `['notifications']`), so we
  // invalidate those alongside the home query to keep the app fully fresh.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchHome(),
        qc.invalidateQueries({ queryKey: ['visits'], exact: false }),
        qc.invalidateQueries({ queryKey: ['patients'] }),
        qc.invalidateQueries({ queryKey: ['scheduler'] }),
        qc.invalidateQueries({ queryKey: ['notifications'] }),
        qc.invalidateQueries({ queryKey: ['rules'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchHome, qc]);
  const stats = home?.stats;
  const todayVisits = home?.todayVisits ?? [];
  const appointments = home?.appointments ?? [];
  const notificationCount = home?.notificationCount ?? 0;
  const hasContent = todayVisits.length > 0 || appointments.length > 0;

  const STAT_CARDS = [
    {
      label: "totalPatients",
      value: stats?.totalActivePatients ?? stats?.totalPatients ?? 0,
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
      label: "todayAppointments",
      value: stats?.todayAppointments ?? stats?.pendingSchedules ?? 0,
      icon: "calendar",
      iconLib: "feather" as const,
      color: "#F59E0B",
      bg: "#FEF9C3",
    },
  ];

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 84);

  // Show shimmer skeletons whenever the home query is fetching — covers the
  // first load, every focus reset and every pull-to-refresh. `isPending` covers
  // the frame between the focus reset clearing the cache and the refetch
  // actually starting, which would otherwise flash the empty state.
  const showSkeleton = isFetching || isPending;

  const isGuest = !user || user.role === "guest";

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
      contentContainerStyle={{ paddingBottom: botPad, flexGrow: 1 }}
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
            <Text style={styles.roleText} numberOfLines={1}>
              {user?.role}
              {workspaceLabel ? ` - ${workspaceLabel}` : ""}
            </Text>
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
              {notificationCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Text>
                </View>
              )}
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

        {/* Stats Row — hidden for guests */}
        {!isGuest && <ScrollView
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
                {showSkeleton ? (
                  <Shimmer
                    width={44}
                    height={26}
                    radius={6}
                    baseColor="rgba(255,255,255,0.25)"
                    highlightColor="rgba(255,255,255,0.45)"
                    style={{ marginTop: 4, marginBottom: 2 }}
                  />
                ) : (
                  <Text style={styles.statValue}>{s.value}</Text>
                )}
                <Text style={styles.statLabel}>{t(s.label as any)}</Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>}
      </LinearGradient>

      {/* Guest login prompt — replaces all body content */}
      {isGuest && (
        <GuestWall>{null}</GuestWall>
      )}

      {/* Skeleton — visits + appointments shimmer while fetching */}
      {showSkeleton && !isGuest && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("todayVisits")}</Text>
            </View>
            <VisitCardSkeleton />
            <VisitCardSkeleton />
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("todayAppointments")}</Text>
            </View>
            <VisitCardSkeleton />
          </View>
        </>
      )}

      {/* Upcoming Visits — hidden when there's nothing to show */}
      {!showSkeleton && !isGuest && todayVisits.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("todayVisits")}
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
                      style={[
                        styles.visitTime,
                        { color: Colors.primaryDark },
                      ]}
                      numberOfLines={1}
                    >
                      {visit.time}
                    </Text>
                    {visit.endTime ? (
                      <Text
                        style={[
                          styles.visitDuration,
                          { color: Colors.primaryDark },
                        ]}
                      >
                        {visit.duration}m
                      </Text>
                    ) : null}
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
      )}

      {/* Upcoming Appointments — driven by `dashboard.appointments` */}
      {!showSkeleton && !isGuest && appointments.length > 0 && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("upcomingAppointments")}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/scheduler");
            }}
          >
            <Text style={[styles.viewAll, { color: Colors.primary }]}>
              {t("viewAll")}
            </Text>
          </Pressable>
        </View>

        {appointments.map((appt, i) => (
          <Animated.View
            key={appt.id}
            entering={FadeInDown.delay(i * 80).springify()}
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: "/appointments/[id]",
                  params: { id: appt.id },
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
                      style={[
                        styles.visitTime,
                        { color: Colors.primaryDark },
                      ]}
                      numberOfLines={1}
                    >
                      {formatTime12h(appt.time)}
                    </Text>
                    {minutesBetween(appt.time, appt.endTime) != null ? (
                      <Text style={[styles.visitDuration, { color: Colors.primaryDark }]}>
                        {minutesBetween(appt.time, appt.endTime)}m
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.visitPatient, { color: colors.text }]}>
                      {appt.patientName}
                    </Text>
                    <Text style={[styles.visitProvider, { color: colors.textSecondary }]}>
                      {appt.type}
                    </Text>
                    {appt.address ? (
                      <Text
                        style={[styles.visitAddress, { color: colors.textTertiary }]}
                        numberOfLines={1}
                      >
                        {appt.address}
                      </Text>
                    ) : null}
                  </View>
                  <StatusBadge status={appt.status} size="sm" />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        ))}
      </View>
      )}

      {/* Empty state — nothing to do today (skipped while skeletons are up) */}
      {!showSkeleton && !isGuest && !hasContent && (
        <View style={styles.section}>
          <EmptyState
            icon="calendar"
            title={t("noScheduledToday")}
            description={t("noScheduledTodayDescription")}
          />
        </View>
      )}
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
    fontSize: 16,
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
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 46,
    minHeight: 40,
  },
  visitTime: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  visitDuration: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
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
