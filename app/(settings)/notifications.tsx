import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HRSwitch } from "@/components/common/HRSwitch";
import { Shimmer } from "@/components/ui/Shimmer";
import type { NotificationPreferenceKey } from "@/data/models/notificationPreferences";
import { useApp } from "@/context/AppContext";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

interface NotifRowProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  sub: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  border?: string;
  colors: ReturnType<typeof useTheme>["colors"];
}

function NotifRow({
  icon,
  iconColor,
  iconBg,
  label,
  sub,
  value,
  disabled,
  onChange,
  border,
  colors,
}: NotifRowProps) {
  return (
    <View
      style={[
        styles.row,
        border ? { borderBottomWidth: 1, borderBottomColor: border } : {},
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon as keyof typeof Feather.glyphMap} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{sub}</Text>
      </View>
      <HRSwitch
        value={value}
        disabled={disabled}
        onValueChange={(v) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(v);
        }}
      />
    </View>
  );
}

function NotificationPreferencesSkeleton({
  colors,
  botPad,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  botPad: number;
}) {
  const shimmerBase = colors.border;
  const shimmerHi = colors.borderLight;

  return (
    <View style={{ padding: 20, paddingBottom: botPad + 16, gap: 16 }}>
      {[1, 2, 3].map((section) => (
        <View key={section} style={{ gap: 8 }}>
          <Shimmer width={80} height={12} radius={4} baseColor={shimmerBase} highlightColor={shimmerHi} />
          <View style={[styles.card, { backgroundColor: colors.surface, gap: 0 }]}>
            {[1, 2].slice(0, section === 3 ? 1 : 2).map((row) => (
              <View key={row} style={styles.skeletonRow}>
                <Shimmer width={40} height={40} radius={12} baseColor={shimmerBase} highlightColor={shimmerHi} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Shimmer width="55%" height={14} baseColor={shimmerBase} highlightColor={shimmerHi} />
                  <Shimmer width="75%" height={11} baseColor={shimmerBase} highlightColor={shimmerHi} />
                </View>
                <Shimmer width={44} height={26} radius={13} baseColor={shimmerBase} highlightColor={shimmerHi} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function NotificationPreferencesError({
  colors,
  message,
  onRetry,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={[styles.center, { flex: 1, padding: 24, gap: 14 }]}>
      <View style={[styles.errorIcon, { backgroundColor: Colors.pastel.red }]}>
        <Feather name="alert-triangle" size={28} color={Colors.icon.red} />
      </View>
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        Couldn&apos;t load preferences
      </Text>
      <Text style={[styles.errorText, { color: colors.textSecondary }]}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={[styles.retryBtn, { backgroundColor: Colors.primary }]}
      >
        <Feather name="refresh-ccw" size={15} color="#fff" />
        <Text style={styles.retryBtnText}>Retry</Text>
      </Pressable>
    </View>
  );
}

export default function NotificationsScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const preferencesQuery = useNotificationPreferences();
  const { data, isLoading, isError, error } = preferencesQuery;
  const refetch = () => preferencesQuery.refetch();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const updateMutation = useUpdateNotificationPreferences();

  const [local, setLocal] = useState({
    pushNotifications: true,
    messages: true,
    visitAlerts: true,
    reminders: true,
    appUpdates: false,
  });

  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);
  const border = colors.borderLight;
  const saving = updateMutation.isPending;
  const errorMessage = error instanceof Error ? error.message : t("error");
  const showLoading = (isLoading && !data) || refreshing;

  const patchPref = (key: NotificationPreferenceKey, value: boolean) => {
    const prev = local[key];
    setLocal((s) => ({ ...s, [key]: value }));
    updateMutation.mutate(
      { [key]: value },
      {
        onError: () => setLocal((s) => ({ ...s, [key]: prev })),
      },
    );
  };

  const header = (
    <View
      style={[
        styles.header,
        { paddingTop: topPad + 12, backgroundColor: colors.background },
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
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{t("notifications")}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>{t("manageAlerts")}</Text>
      </View>
    </View>
  );

  if (showLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <NotificationPreferencesSkeleton colors={colors} botPad={botPad} />
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <NotificationPreferencesError
          colors={colors}
          message={errorMessage}
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 16, gap: 16 }}
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
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("general")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <NotifRow
              icon="bell"
              iconColor={Colors.icon.purple}
              iconBg={Colors.pastel.purple}
              label={t("pushNotifications")}
              sub={t("receivingAlerts")}
              value={local.pushNotifications}
              disabled={saving}
              onChange={(v) => patchPref("pushNotifications", v)}
              border={border}
              colors={colors}
            />
            <NotifRow
              icon="message-circle"
              iconColor={Colors.icon.teal}
              iconBg={Colors.pastel.teal}
              label={t("messages")}
              sub={t("patientTeamMessages")}
              value={local.messages}
              disabled={saving}
              onChange={(v) => patchPref("messages", v)}
              colors={colors}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("clinical")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <NotifRow
              icon="calendar"
              iconColor={Colors.icon.teal}
              iconBg={Colors.pastel.teal}
              label={t("visitAlerts")}
              sub={t("upcomingAssignedVisits")}
              value={local.visitAlerts}
              disabled={saving}
              onChange={(v) => patchPref("visitAlerts", v)}
              border={border}
              colors={colors}
            />
            <NotifRow
              icon="clock"
              iconColor={Colors.icon.orange}
              iconBg={Colors.pastel.orange}
              label={t("reminders")}
              sub={t("scheduleReminders")}
              value={local.reminders}
              disabled={saving}
              onChange={(v) => patchPref("reminders", v)}
              colors={colors}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("system")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <NotifRow
              icon="refresh-cw"
              iconColor={Colors.icon.green}
              iconBg={Colors.pastel.green}
              label={t("appUpdates")}
              sub={t("newFeatures")}
              value={local.appUpdates}
              disabled={saving}
              onChange={(v) => patchPref("appUpdates", v)}
              colors={colors}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  retryBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});
