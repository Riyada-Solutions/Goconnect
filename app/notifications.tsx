import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Shimmer } from "@/components/ui/Shimmer";
import { GuestWall } from "@/components/ui/GuestWall";
import { useApp } from "@/context/AppContext";
import type { ApiNotification } from "@/data/models/notification";
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

// ─── Time helpers ─────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${formatHour(d)}`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatHour(d: Date): string {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

type Group = "today" | "yesterday" | "earlier";

function getGroup(iso: string): Group {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "yesterday";
  return "earlier";
}

// ─── Icon config ──────────────────────────────────────────────────────────────

const NOTIF_ICON: Record<
  string,
  { icon: string; iconColor: string; iconBg: string }
> = {
  visit_assigned:       { icon: "calendar",       iconColor: Colors.icon.teal,   iconBg: Colors.pastel.teal   },
  visit_completed:      { icon: "check-circle",   iconColor: Colors.icon.green,  iconBg: Colors.pastel.green  },
  patient_added:        { icon: "user-plus",      iconColor: Colors.icon.blue,   iconBg: Colors.pastel.blue   },
  appointment_reminder: { icon: "clock",          iconColor: Colors.icon.orange, iconBg: Colors.pastel.orange },
  message:              { icon: "message-circle", iconColor: Colors.icon.purple, iconBg: Colors.pastel.purple },
  lab_result:           { icon: "activity",       iconColor: "#E11D48",          iconBg: "#FFF1F2"             },
  shift_change:         { icon: "repeat",         iconColor: "#7C3AED",          iconBg: "#F5F3FF"             },
  system:               { icon: "settings",       iconColor: "#6B7280",          iconBg: "#F3F4F6"             },
};

function getIcon(type: string) {
  return NOTIF_ICON[type] ?? { icon: "bell", iconColor: Colors.primary, iconBg: Colors.pastel.teal };
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function NotifSkeleton({ colors }: { colors: any }) {
  const base = colors.border;
  const hi = colors.borderLight;
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12, gap: 20 }}>
      {["today", "yesterday", "earlier"].map((g) => (
        <View key={g} style={{ gap: 10 }}>
          <Shimmer width={80} height={11} radius={4} baseColor={base} highlightColor={hi} />
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            {[0, 1].map((i) => (
              <View key={i} style={[s.notifRow, i === 0 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
                <Shimmer width={7}  height={7}  radius={4}  baseColor={base} highlightColor={hi} />
                <Shimmer width={42} height={42} radius={12} baseColor={base} highlightColor={hi} />
                <View style={{ flex: 1, gap: 7 }}>
                  <Shimmer width="55%" height={13} baseColor={base} highlightColor={hi} />
                  <Shimmer width="80%" height={11} baseColor={base} highlightColor={hi} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Single row ───────────────────────────────────────────────────────────────

interface RowProps {
  notif: ApiNotification;
  colors: any;
  isDark: boolean;
  onPress: () => void;
  onDismiss: () => void;
  isLast: boolean;
}

function NotifRow({ notif, colors, isDark, onPress, onDismiss, isLast }: RowProps) {
  const cfg = getIcon(notif.type);
  const tx  = useSharedValue(0);
  const op  = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity: op.value,
  }));

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tx.value = withTiming(-400, { duration: 260 });
    op.value = withTiming(0,    { duration: 260 }, (done) => {
      if (done) runOnJS(onDismiss)();
    });
  }, [tx, op, onDismiss]);

  const unreadBg = isDark ? "rgba(19,168,189,0.07)" : "#F0FBFD";

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onLongPress={handleDismiss}
        delayLongPress={400}
        style={({ pressed }) => [
          s.notifRow,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
          !notif.read && { backgroundColor: unreadBg },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={s.dotWrap}>
          <View style={[s.unreadDot, { backgroundColor: notif.read ? "transparent" : Colors.primary }]} />
        </View>
        <View style={[s.notifIcon, { backgroundColor: cfg.iconBg }]}>
          <Feather name={cfg.icon as any} size={18} color={cfg.iconColor} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={s.notifMeta}>
            <Text
              style={[s.notifTitle, { color: colors.text, fontFamily: notif.read ? "Inter_500Medium" : "Inter_700Bold" }]}
              numberOfLines={1}
            >
              {notif.title}
            </Text>
            <Text style={[s.notifTime, { color: colors.textTertiary }]}>
              {relativeTime(notif.createdAt)}
            </Text>
          </View>
          <Text style={[s.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
            {notif.body}
          </Text>
        </View>
        <Pressable onPress={handleDismiss} style={s.dismissBtn} hitSlop={10}>
          <Feather name="x" size={14} color={colors.textTertiary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// ─── Tab pill ─────────────────────────────────────────────────────────────────

function TabPill({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={[s.tabPill, active ? { backgroundColor: Colors.primary } : { backgroundColor: "transparent" }]}
    >
      <Text style={[s.tabPillText, { color: active ? "#fff" : "#6B7280" }]}>{label}</Text>
      {!!count && count > 0 && (
        <View style={[s.tabCount, { backgroundColor: active ? "rgba(255,255,255,0.25)" : Colors.pastel.teal }]}>
          <Text style={[s.tabCountText, { color: active ? "#fff" : Colors.primary }]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

type FilterTab = "all" | "unread";
type ListItem =
  | { kind: "header"; group: Group }
  | { kind: "notif"; notif: ApiNotification; isLast: boolean; group: Group };

export default function NotificationsScreen() {
  return <NotificationsContent />;
}

function NotificationsContent() {
  const { t, user } = useApp();
  const isGuest = !user || user.role === "guest";
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const [activeTab, setActiveTab] = React.useState<FilterTab>("all");

  const query   = useNotifications(activeTab);
  const refetch = () => query.refetch();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const markReadMutation   = useMarkNotificationRead(activeTab);
  const markAllMutation    = useMarkAllRead();
  const deleteMutation     = useDeleteNotification(activeTab);

  const items: ApiNotification[] = query.data?.data ?? [];
  const unreadCount = items.filter((n) => !n.read).length;

  // Build FlatList data: group headers + rows.
  const flatData = React.useMemo<ListItem[]>(() => {
    const groups: Group[] = ["today", "yesterday", "earlier"];
    const result: ListItem[] = [];
    for (const group of groups) {
      const grouped = items.filter((n) => getGroup(n.createdAt) === group);
      if (grouped.length === 0) continue;
      result.push({ kind: "header", group });
      grouped.forEach((notif, idx) => {
        result.push({ kind: "notif", notif, isLast: idx === grouped.length - 1, group });
      });
    }
    return result;
  }, [items]);

  const handleMarkRead = useCallback((id: number) => {
    Haptics.selectionAsync();
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  const handleDismiss = useCallback((id: number) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleMarkAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAllMutation.mutate();
  };

  const GROUP_LABELS: Record<Group, string> = {
    today: t("todayLabel"),
    yesterday: t("yesterdayLabel"),
    earlier: t("earlierLabel"),
  };

  // ── Header (always visible) ──────────────────────────────────────────────
  const header = (
    <View style={[s.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); router.back(); }}
        style={s.backBtn}
      >
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={s.titleRow}>
          <Text style={[s.title, { color: colors.text }]}>{t("notifications")}</Text>
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={[s.titleSub, { color: colors.textSecondary }]}>
          {unreadCount > 0 ? `${unreadCount} ${t("unreadMessages")}` : t("allCaughtUp")}
        </Text>
      </View>
      {unreadCount > 0 && (
        <Pressable
          onPress={handleMarkAll}
          style={({ pressed }) => [s.markAllBtn, { backgroundColor: Colors.pastel.teal, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="check-square" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={[s.markAllText, { color: Colors.primary }]}>{t("readAll")}</Text>
        </Pressable>
      )}
    </View>
  );

  // ── Tabs ────────────────────────────────────────────────────────────────
  const tabs = (
    <View style={[s.tabBar, { backgroundColor: colors.background }]}>
      <View style={[s.tabTrack, { backgroundColor: isDark ? colors.surface : "#EDEEF2" }]}>
        <TabPill
          label={t("all")}
          active={activeTab === "all"}
          count={items.length}
          onPress={() => setActiveTab("all")}
        />
        <TabPill
          label={t("unread")}
          active={activeTab === "unread"}
          count={unreadCount}
          onPress={() => setActiveTab("unread")}
        />
      </View>
      <Text style={[s.hintText, { color: colors.textTertiary }]}>{t("holdToDismiss")}</Text>
    </View>
  );

  // ── Loading ────────────────────────────────────────────────────────────
  const showSkeleton = (query.isLoading && !query.data) || refreshing;

  if (isGuest) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {header}
        <GuestWall>{null}</GuestWall>
      </View>
    );
  }

  if (showSkeleton) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {header}
        {tabs}
        <NotifSkeleton colors={colors} />
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (query.isError && !query.data) {
    const msg = query.error instanceof Error ? query.error.message : t("error");
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {header}
        {tabs}
        <View style={s.center}>
          <View style={[s.errorIcon, { backgroundColor: Colors.pastel.red }]}>
            <Feather name="alert-triangle" size={28} color={Colors.icon.red} />
          </View>
          <Text style={[s.errorTitle, { color: colors.text }]}>Couldn&apos;t load notifications</Text>
          <Text style={[s.errorBody, { color: colors.textSecondary }]}>{msg}</Text>
          <Pressable
            onPress={refetch}
            style={[s.retryBtn, { backgroundColor: Colors.primary }]}
          >
            <Feather name="refresh-ccw" size={15} color="#fff" />
            <Text style={s.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────
  const isEmpty = flatData.length === 0;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {header}
      {tabs}

      {isEmpty ? (
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: Colors.pastel.teal }]}>
            <Feather name="bell-off" size={36} color={Colors.primary} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>
            {activeTab === "unread" ? t("noUnreadNotifications") : t("noNotifications")}
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            {activeTab === "unread" ? t("readEverything") : t("newAlertsHere")}
          </Text>
          {activeTab === "unread" && (
            <Pressable
              onPress={() => setActiveTab("all")}
              style={({ pressed }) => [s.viewAllBtn, { backgroundColor: Colors.pastel.teal, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                {t("viewAll")}
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) =>
            item.kind === "header" ? `h-${item.group}` : `n-${item.notif.id}`
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: botPad + 16,
            gap: 0,
          }}
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
            if (item.kind === "header") {
              const gi = ["today", "yesterday", "earlier"].indexOf(item.group);
              return (
                <Animated.View
                  entering={FadeInDown.delay(gi * 60).springify()}
                  style={[s.groupHeader, index > 0 && { marginTop: 16 }]}
                >
                  <Text style={[s.groupLabel, { color: colors.textSecondary }]}>
                    {GROUP_LABELS[item.group]}
                  </Text>
                  <View style={[s.groupLine, { backgroundColor: colors.borderLight }]} />
                </Animated.View>
              );
            }
            // First notif after header — wrap group in card
            const prevItem = flatData[index - 1];
            const isFirstInGroup = prevItem?.kind === "header";
            const nextItem = flatData[index + 1];
            const isLastInGroup = !nextItem || nextItem.kind === "header";

            return (
              <View
                style={[
                  isFirstInGroup && s.cardTop,
                  isLastInGroup && s.cardBottom,
                  { backgroundColor: colors.surface },
                  s.cardShadow,
                ]}
              >
                <NotifRow
                  notif={item.notif}
                  colors={colors}
                  isDark={isDark}
                  isLast={item.isLast}
                  onPress={() => handleMarkRead(item.notif.id)}
                  onDismiss={() => handleDismiss(item.notif.id)}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60, padding: 24 },

  header: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 20, paddingBottom: 6, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  titleSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  markAllBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, marginTop: 4,
  },
  markAllText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  tabBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 10, gap: 12,
  },
  tabTrack: { flexDirection: "row", borderRadius: 12, padding: 3, gap: 2 },
  tabPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, gap: 5,
  },
  tabPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabCount: {
    borderRadius: 7, paddingHorizontal: 6, paddingVertical: 1,
    minWidth: 20, alignItems: "center",
  },
  tabCountText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  hintText: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: "auto" },

  groupHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  groupLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  groupLine: { flex: 1, height: 1 },

  card: { borderRadius: 16, overflow: "hidden" },
  cardTop: { borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden" },
  cardBottom: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: "hidden" },
  cardShadow: {
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },

  notifRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingVertical: 13, paddingHorizontal: 14, gap: 10,
  },
  dotWrap: { width: 8, alignItems: "center", paddingTop: 18 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  notifIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  notifMeta: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", gap: 6,
  },
  notifTitle: { fontSize: 14, flex: 1 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular", flexShrink: 0 },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  dismissBtn: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
  },

  errorIcon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  errorTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  errorBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, marginTop: 4,
  },
  retryBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },

  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 260 },
  viewAllBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
});
