import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
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

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotifType =
  | "visit_assigned"
  | "visit_completed"
  | "patient_added"
  | "appointment_reminder"
  | "message"
  | "lab_result"
  | "shift_change"
  | "system";

export interface Notification {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  time: string;         // human-readable relative string
  read: boolean;
  group: "today" | "yesterday" | "earlier";
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "visit_assigned",
    title: "New Visit Assigned",
    body: "You have a home visit for Ahmed Al-Rashid at 10:00 AM – Riyadh, Al Olaya.",
    time: "9 min ago",
    read: false,
    group: "today",
  },
  {
    id: 2,
    type: "appointment_reminder",
    title: "Upcoming Appointment",
    body: "Clinic session with Fatima Al-Zahra starts in 30 minutes. Room 4, Floor 2.",
    time: "27 min ago",
    read: false,
    group: "today",
  },
  {
    id: 3,
    type: "lab_result",
    title: "Lab Results Ready",
    body: "CBC and lipid panel for Khalid Al-Mutairi are now available in his profile.",
    time: "1 h ago",
    read: false,
    group: "today",
  },
  {
    id: 4,
    type: "message",
    title: "Message from Dr. Sara",
    body: "Please review the updated care plan for Nora Al-Qahtani before 3 PM today.",
    time: "2 h ago",
    read: false,
    group: "today",
  },
  {
    id: 5,
    type: "visit_completed",
    title: "Visit Marked Complete",
    body: "Home visit for Maha Al-Ghamdi has been closed and submitted for review.",
    time: "4 h ago",
    read: true,
    group: "today",
  },
  {
    id: 6,
    type: "shift_change",
    title: "Shift Update",
    body: "Your Tuesday evening shift has been swapped with Nurse Reem Al-Harbi.",
    time: "6 h ago",
    read: true,
    group: "today",
  },
  {
    id: 7,
    type: "patient_added",
    title: "New Patient Assigned",
    body: "Omar Al-Farsi (DOB 1972-04-15) has been added to your active patient list.",
    time: "Yesterday 10:05 AM",
    read: false,
    group: "yesterday",
  },
  {
    id: 8,
    type: "visit_assigned",
    title: "Visit Rescheduled",
    body: "Your follow-up with Saad Al-Dossari moved to Friday 2:00 PM – confirmed.",
    time: "Yesterday 2:30 PM",
    read: true,
    group: "yesterday",
  },
  {
    id: 9,
    type: "message",
    title: "Care Coordinator Update",
    body: "Discharge summary for Aisha Al-Zahrani has been reviewed and approved.",
    time: "Yesterday 5:00 PM",
    read: true,
    group: "yesterday",
  },
  {
    id: 10,
    type: "system",
    title: "App Update Available",
    body: "GoConnect v1.1.0 brings faster scheduling, offline access, and bug fixes.",
    time: "Yesterday 8:00 AM",
    read: true,
    group: "yesterday",
  },
  {
    id: 11,
    type: "appointment_reminder",
    title: "Weekly Schedule Published",
    body: "Your schedule for next week is live — 12 visits, 3 clinics assigned.",
    time: "Dec 18",
    read: true,
    group: "earlier",
  },
  {
    id: 12,
    type: "lab_result",
    title: "Critical Lab Alert",
    body: "Potassium level for Youssef Al-Anazi is critically low. Immediate review needed.",
    time: "Dec 17",
    read: true,
    group: "earlier",
  },
  {
    id: 13,
    type: "patient_added",
    title: "Patient Transferred",
    body: "Hind Al-Otaibi has been transferred from Ward 3 to your home-care caseload.",
    time: "Dec 15",
    read: true,
    group: "earlier",
  },
];

// ─── Icon config ──────────────────────────────────────────────────────────────
const NOTIF_CONFIG: Record<
  NotifType,
  { icon: string; iconColor: string; iconBg: string }
> = {
  visit_assigned:       { icon: "calendar",       iconColor: Colors.icon.teal,   iconBg: Colors.pastel.teal   },
  visit_completed:      { icon: "check-circle",   iconColor: Colors.icon.green,  iconBg: Colors.pastel.green  },
  patient_added:        { icon: "user-plus",      iconColor: Colors.icon.blue,   iconBg: Colors.pastel.blue   },
  appointment_reminder: { icon: "clock",          iconColor: Colors.icon.orange, iconBg: Colors.pastel.orange },
  message:              { icon: "message-circle", iconColor: Colors.icon.purple, iconBg: Colors.pastel.purple },
  lab_result:           { icon: "activity",       iconColor: "#E11D48",          iconBg: "#FFF1F2"            },
  shift_change:         { icon: "repeat",         iconColor: "#7C3AED",          iconBg: "#F5F3FF"            },
  system:               { icon: "settings",       iconColor: "#6B7280",          iconBg: "#F3F4F6"            },
};


// ─── Single dismissible row ───────────────────────────────────────────────────
interface NotifItemProps {
  notif: Notification;
  colors: any;
  isDark: boolean;
  onPress: () => void;
  onDismiss: () => void;
  isLast: boolean;
}
function NotifItem({ notif, colors, isDark, onPress, onDismiss, isLast }: NotifItemProps) {
  const cfg = NOTIF_CONFIG[notif.type];
  const translateX = useSharedValue(0);
  const opacity    = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    translateX.value = withTiming(-380, { duration: 260 });
    opacity.value    = withTiming(0,    { duration: 260 }, (done) => {
      if (done) runOnJS(onDismiss)();
    });
  };

  const unreadBg = isDark ? "rgba(19,168,189,0.07)" : "#F0FBFD";

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onLongPress={handleDismiss}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.notifRow,
          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
          !notif.read && { backgroundColor: unreadBg },
          pressed && { opacity: 0.7 },
        ]}
      >
        {/* Unread dot */}
        <View style={styles.dotWrap}>
          <View
            style={[
              styles.unreadDot,
              { backgroundColor: notif.read ? "transparent" : Colors.primary },
            ]}
          />
        </View>

        {/* Icon */}
        <View style={[styles.notifIcon, { backgroundColor: cfg.iconBg }]}>
          <Feather name={cfg.icon as any} size={18} color={cfg.iconColor} />
        </View>

        {/* Content */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.notifMeta}>
            <Text
              style={[
                styles.notifTitle,
                { color: colors.text, fontFamily: notif.read ? "Inter_500Medium" : "Inter_700Bold" },
              ]}
              numberOfLines={1}
            >
              {notif.title}
            </Text>
            <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
              {notif.time}
            </Text>
          </View>
          <Text
            style={[styles.notifBody, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {notif.body}
          </Text>
        </View>

        {/* Dismiss button */}
        <Pressable onPress={handleDismiss} style={styles.dismissBtn} hitSlop={10}>
          <Feather name="x" size={14} color={colors.textTertiary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// ─── Filter tab ───────────────────────────────────────────────────────────────
type FilterTab = "all" | "unread";

interface TabPillProps {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
}
function TabPill({ label, active, count, onPress }: TabPillProps) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={[
        styles.tabPill,
        active
          ? { backgroundColor: Colors.primary }
          : { backgroundColor: "transparent" },
      ]}
    >
      <Text
        style={[
          styles.tabPillText,
          { color: active ? "#fff" : "#6B7280" },
        ]}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View
          style={[
            styles.tabCount,
            { backgroundColor: active ? "rgba(255,255,255,0.25)" : Colors.pastel.teal },
          ]}
        >
          <Text
            style={[
              styles.tabCountText,
              { color: active ? "#fff" : Colors.primary },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const { t } = useApp();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayed =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    Haptics.selectionAsync();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const groups: Array<"today" | "yesterday" | "earlier"> = [
    "today",
    "yesterday",
    "earlier",
  ];

  const isEmpty = displayed.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.delay(0).springify()}
        style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}
      >
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("notifications")}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.titleSub, { color: colors.textSecondary }]}>
            {unreadCount > 0
              ? `${unreadCount} ${t("unreadMessages")}`
              : t("allCaughtUp")}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          {unreadCount > 0 && (
            <Pressable
              onPress={markAllRead}
              style={({ pressed }) => [
                styles.markAllBtn,
                { backgroundColor: Colors.pastel.teal, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="check-square" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.markAllText, { color: Colors.primary }]}>{t("readAll")}</Text>
            </Pressable>
          )}
          {/* <Pressable
            onPress={() => { Haptics.selectionAsync(); router.push("/(settings)/notifications"); }}
            style={({ pressed }) => [
              styles.settingsGear,
              { backgroundColor: isDark ? colors.surface : "#F0F2F7", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="settings" size={16} color={colors.textSecondary} />
          </Pressable> */}
        </View>
      </Animated.View>

      {/* ── Filter tabs ── */}
      <Animated.View
        entering={FadeInDown.delay(40).springify()}
        style={[styles.tabBar, { backgroundColor: colors.background }]}
      >
        <View style={[styles.tabTrack, { backgroundColor: isDark ? colors.surface : "#EDEEF2" }]}>
          <TabPill
            label={t("all")}
            active={activeTab === "all"}
            count={notifications.length}
            onPress={() => setActiveTab("all")}
          />
          <TabPill
            label={t("unread")}
            active={activeTab === "unread"}
            count={unreadCount}
            onPress={() => setActiveTab("unread")}
          />
        </View>
        <Text style={[styles.hintText, { color: colors.textTertiary }]}>
          {t("holdToDismiss")}
        </Text>
      </Animated.View>

      {/* ── Empty state ── */}
      {isEmpty && (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: Colors.pastel.teal }]}>
            <Feather name="bell-off" size={36} color={Colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {activeTab === "unread" ? t("noUnreadNotifications") : t("noNotifications")}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {activeTab === "unread"
              ? t("readEverything")
              : t("newAlertsHere")}
          </Text>
          {activeTab === "unread" && (
            <Pressable
              onPress={() => setActiveTab("all")}
              style={({ pressed }) => [
                styles.viewAllBtn,
                { backgroundColor: Colors.pastel.teal, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                {t("viewAll")}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── List ── */}
      {!isEmpty && (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: botPad + 16,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group, gi) => {
            const items = displayed.filter((n) => n.group === group);
            if (items.length === 0) return null;
            return (
              <Animated.View
                key={group}
                entering={FadeInDown.delay(gi * 60).springify()}
              >
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>
                    {group === "today" ? t("todayLabel") : group === "yesterday" ? t("yesterdayLabel") : t("earlierLabel")}
                  </Text>
                  <View style={[styles.groupLine, { backgroundColor: colors.borderLight }]} />
                </View>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      shadowColor: isDark ? "#000" : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  {items.map((notif, idx) => (
                    <NotifItem
                      key={notif.id}
                      notif={notif}
                      colors={colors}
                      isDark={isDark}
                      onPress={() => markRead(notif.id)}
                      onDismiss={() => dismiss(notif.id)}
                      isLast={idx === items.length - 1}
                    />
                  ))}
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  titleSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
    minWidth: 22, alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  markAllBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 10, marginTop: 4,
  },
  markAllText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  settingsGear: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center" as const, justifyContent: "center" as const,
  },

  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  tabTrack: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
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

  card: {
    borderRadius: 16, overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },

  notifRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingVertical: 13, paddingHorizontal: 14,
    gap: 10,
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
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 2,
  },

  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    gap: 12, paddingBottom: 60,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 260 },
  viewAllBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
});
