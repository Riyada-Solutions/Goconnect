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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { HRSwitch } from "@/components/common/HRSwitch";

interface NotifRowProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  border?: string;
  colors: any;
}

function NotifRow({ icon, iconColor, iconBg, label, sub, value, onChange, border, colors }: NotifRowProps) {
  return (
    <View style={[styles.row, border ? { borderBottomWidth: 1, borderBottomColor: border } : {}]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{sub}</Text>
      </View>
      <HRSwitch
        value={value}
        onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(v); }}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);
  const border = colors.borderLight;

  const [push, setPush] = useState(true);
  const [visits, setVisits] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [updates, setUpdates] = useState(false);
  const [messages, setMessages] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t("notifications")}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>{t("manageAlerts")}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t("general")}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <NotifRow
              icon="bell" iconColor={Colors.icon.purple} iconBg={Colors.pastel.purple}
              label={t("pushNotifications")} sub={t("receivingAlerts")}
              value={push} onChange={setPush} border={border} colors={colors}
            />
            <NotifRow
              icon="message-circle" iconColor={Colors.icon.teal} iconBg={Colors.pastel.teal}
              label={t("messages")} sub={t("patientTeamMessages")}
              value={messages} onChange={setMessages} colors={colors}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t("clinical")}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <NotifRow
              icon="calendar" iconColor={Colors.icon.teal} iconBg={Colors.pastel.teal}
              label={t("visitAlerts")} sub={t("upcomingAssignedVisits")}
              value={visits} onChange={setVisits} border={border} colors={colors}
            />
            <NotifRow
              icon="clock" iconColor={Colors.icon.orange} iconBg={Colors.pastel.orange}
              label={t("reminders")} sub={t("scheduleReminders")}
              value={reminders} onChange={setReminders} colors={colors}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t("system")}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <NotifRow
              icon="refresh-cw" iconColor={Colors.icon.green} iconBg={Colors.pastel.green}
              label={t("appUpdates")} sub={t("newFeatures")}
              value={updates} onChange={setUpdates} colors={colors}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 20, paddingBottom: 8, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  card: {
    borderRadius: 16, paddingHorizontal: 16,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});
