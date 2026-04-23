import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useState } from "react";
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

import AsyncStorage from "@react-native-async-storage/async-storage";

import { HRSwitch } from "@/components/common/HRSwitch";
import { Colors } from "@/theme/colors";
import { Language } from "@/config/i18n";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

// ─── Toggle row (icon + label + subtitle + switch) ───────────────────────────
interface ToggleRowProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
  value: boolean;
  onToggle: () => void;
  borderBottom?: boolean;
  borderColor: string;
  textColor: string;
  subColor: string;
}
function ToggleRow({
  icon, iconBg, iconColor, label, sub, value, onToggle,
  borderBottom, borderColor, textColor, subColor,
}: ToggleRowProps) {
  return (
    <View style={[
      styles.row,
      borderBottom && { borderBottomWidth: 1, borderBottomColor: borderColor },
    ]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={17} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: subColor }]}>{sub}</Text>
      </View>
      <HRSwitch value={value} onValueChange={onToggle} />
    </View>
  );
}

// ─── Nav row (icon + label + optional value + chevron) ───────────────────────
interface NavRowProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  onPress: () => void;
  borderBottom?: boolean;
  borderColor: string;
  textColor: string;
  subColor: string;
}
function NavRow({
  icon, iconBg, iconColor, label, value, onPress,
  borderBottom, borderColor, textColor, subColor,
}: NavRowProps) {
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => [
        styles.row,
        borderBottom && { borderBottomWidth: 1, borderBottomColor: borderColor },
        pressed && { opacity: 0.65 },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={17} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { flex: 1, color: textColor }]}>{label}</Text>
      {value ? (
        <Text style={[styles.rowValue, { color: subColor }]}>{value}</Text>
      ) : null}
      <Feather name="chevron-right" size={17} color={subColor} />
    </Pressable>
  );
}

export default function AppSettingsScreen() {
  const { t, language, setLanguage, isDark, setTheme } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(compatible && enrolled);
        const stored = await AsyncStorage.getItem("@goconnect/biometric");
        if (stored === "true") setBiometricEnabled(true);
      } catch {}
    })();
  }, []);

  const toggleBiometric = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !biometricEnabled;
    if (next) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("biometricLogin"),
        fallbackLabel: t("cancel"),
      });
      if (!result.success) return;
    }
    setBiometricEnabled(next);
    await AsyncStorage.setItem("@goconnect/biometric", String(next));
  };

  const bd = colors.borderLight;

  const toggleDark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(isDark ? "light" : "dark");
  };

  const toggleLang = (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(lang);
  };

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
          <Text style={[styles.title, { color: colors.text }]}>{t("settings")}</Text>
          <Text style={[styles.titleSub, { color: colors.textSecondary }]}>
            {t("managePreferences")}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Appearance ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("appearance")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <ToggleRow
              icon="moon"
              iconBg={Colors.pastel.purple}
              iconColor={Colors.icon.purple}
              label={t("darkMode")}
              sub={isDark ? t("darkThemeActive") : t("lightThemeActive")}
              value={isDark}
              onToggle={toggleDark}
              borderBottom={false}
              borderColor={bd}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
          </View>
        </Animated.View>

        {/* ── Language ── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("languageRegion")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Pressable
              onPress={() => toggleLang("en")}
              style={({ pressed }) => [
                styles.row,
                { borderBottomWidth: 1, borderBottomColor: bd },
                pressed && { opacity: 0.65 },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: Colors.pastel.teal }]}>
                <Text style={styles.flagEmoji}>🇬🇧</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{t("english")}</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {t("englishRegion")}
                </Text>
              </View>
              {language === "en" ? (
                <View style={[styles.activeChip, { backgroundColor: Colors.pastel.teal }]}>
                  <Text style={[styles.activeChipText, { color: Colors.primary }]}>{t("activeLabel")}</Text>
                </View>
              ) : (
                <Feather name="circle" size={18} color={bd} />
              )}
            </Pressable>
            <Pressable
              onPress={() => toggleLang("ar")}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.65 }]}
            >
              <View style={[styles.iconBox, { backgroundColor: Colors.pastel.orange }]}>
                <Text style={styles.flagEmoji}>🇸🇦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{t("arabic")}</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {t("arabicRegion")}
                </Text>
              </View>
              {language === "ar" ? (
                <View style={[styles.activeChip, { backgroundColor: Colors.pastel.teal }]}>
                  <Text style={[styles.activeChipText, { color: Colors.primary }]}>{t("activeLabel")}</Text>
                </View>
              ) : (
                <Feather name="circle" size={18} color={bd} />
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Notifications ── */}
        {/* <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("notifications")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <ToggleRow
              icon="bell"
              iconBg={Colors.pastel.purple}
              iconColor={Colors.icon.purple}
              label={t("pushNotifications")}
              sub={pushNotif ? t("receivingAlerts") : t("notificationsPaused")}
              value={pushNotif}
              onToggle={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPushNotif((v) => !v);
              }}
              borderBottom
              borderColor={bd}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
            <ToggleRow
              icon="mail"
              iconBg={Colors.pastel.blue}
              iconColor={Colors.icon.blue}
              label={t("emailNotifications")}
              sub={emailNotif ? t("emailAlertsActive") : t("emailAlertsOff")}
              value={emailNotif}
              onToggle={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEmailNotif((v) => !v);
              }}
              borderBottom={false}
              borderColor={bd}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
          </View>
        </Animated.View> */}

        {/* ── Security ── */}
        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("security")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <NavRow
              icon="lock"
              iconBg={Colors.pastel.orange}
              iconColor={Colors.icon.orange}
              label={t("changePassword")}
              onPress={() => router.push("/(settings)/change-password")}
              borderBottom
              borderColor={bd}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
            <NavRow
              icon="shield"
              iconBg={Colors.pastel.green}
              iconColor={Colors.icon.green}
              label={t("privacyPolicy")}
              onPress={() => router.push("/(settings)/privacy")}
              borderBottom={biometricAvailable}
              borderColor={bd}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
            {biometricAvailable && (
              <ToggleRow
                icon="smartphone"
                iconBg={Colors.pastel.blue}
                iconColor={Colors.icon.blue}
                label={t("biometricLogin")}
                sub={t("biometricSub")}
                value={biometricEnabled}
                onToggle={toggleBiometric}
                borderBottom={false}
                borderColor={bd}
                textColor={colors.text}
                subColor={colors.textSecondary}
              />
            )}
          </View>
        </Animated.View>

        {/* ── Support ── */}
        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("support")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <NavRow
              icon="info"
              iconBg={Colors.pastel.blue}
              iconColor={Colors.icon.blue}
              label={t("about")}
              onPress={() => router.push("/(settings)/about")}
              borderBottom
              borderColor={bd}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
            <NavRow
              icon="file-text"
              iconBg={Colors.pastel.teal}
              iconColor={Colors.icon.teal}
              label={t("terms")}
              onPress={() => router.push("/(settings)/terms")}
              borderBottom
              borderColor={bd}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
            <NavRow
              icon="message-square"
              iconBg={Colors.pastel.green}
              iconColor={Colors.icon.green}
              label={t("helpFeedback")}
              onPress={() => {}}
              borderColor={bd}
              textColor={colors.text}
              subColor={colors.textSecondary}
            />
          </View>
        </Animated.View>

        {/* ── App version ── */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <View style={[styles.versionCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconBox, { backgroundColor: Colors.pastel.teal }]}>
              <Feather name="layers" size={17} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t("version")}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                {t("appVersion")} ({t("buildLabel")} 1)
              </Text>
            </View>
            <View style={[styles.versionBadge, { backgroundColor: Colors.pastel.green }]}>
              <Text style={[styles.versionBadgeText, { color: Colors.icon.green }]}>
                {t("upToDate")}
              </Text>
            </View>
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  titleSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },

  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },

  iconBox: {
    width: 38, height: 38,
    borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  flagEmoji: { fontSize: 20 },

  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginRight: 4,
  },

  activeChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  versionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  versionBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
