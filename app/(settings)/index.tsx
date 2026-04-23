import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

interface MenuItemProps {
  icon: string;
  label: string;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
  isLast?: boolean;
  isDark: boolean;
  border: string;
  text: string;
  subText?: string;
}

function MenuItem({
  icon,
  label,
  iconColor,
  iconBg,
  onPress,
  isLast,
  isDark,
  border,
  text,
  subText,
}: MenuItemProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.menuItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: border },
        pressed && { opacity: 0.6 },
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: text }]}>{label}</Text>
        {subText ? (
          <Text style={[styles.menuSub, { color: Colors.light.textSecondary }]}>
            {subText}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={Colors.light.textSecondary} />
    </Pressable>
  );
}

export default function ProfileMainScreen() {
  const { user, logout, t } = useApp();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const border = isDark ? colors.borderLight : "#F0F2F7";
  const textColor = colors.text;

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(t("logoutConfirm"));
      if (confirmed) {
        logout().then(() => router.replace("/(auth)/login"));
      }
    } else {
      showDialog({
        variant: "confirm",
        title: t("logout"),
        message: t("logoutConfirm"),
        primaryAction: {
          label: t("yes"),
          destructive: true,
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
        secondaryAction: { label: t("no"), onPress: () => {} },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FeedbackDialog {...dialogProps} />
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(0).springify()}
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surface : "#EAF8FB" }]}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t("myProfile")}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {t("accountSettings")}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/(settings)/edit-profile");
          }}
          style={[styles.editHeaderBtn, { backgroundColor: isDark ? colors.surface : "#EAF8FB" }]}
        >
          <Feather name="edit-2" size={16} color={Colors.primary} />
        </Pressable>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: botPad + 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View style={[styles.profileCard, {
            backgroundColor: colors.surface,
            shadowColor: isDark ? "#000" : "rgba(19,168,189,0.12)",
          }]}>
            {/* Avatar */}
            <View style={styles.avatarCircle}>
              <Feather name="user" size={40} color={Colors.primary} />
            </View>
            <Text style={[styles.profileName, { color: textColor }]}>
              {user?.name ?? "—"}
            </Text>
            <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
              {user?.role ?? "—"}
            </Text>
          </View>
        </Animated.View>

        {/* Menu */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.menuCard, {
            backgroundColor: colors.surface,
            shadowColor: isDark ? "#000" : "rgba(0,0,0,0.06)",
          }]}>
            <MenuItem
              icon="user"
              label={t("editProfile")}
              iconColor={Colors.icon.teal}
              iconBg={Colors.pastel.teal}
              onPress={() => router.push("/(settings)/edit-profile")}
              isDark={isDark}
              border={border}
              text={textColor}
            />
            <MenuItem
              icon="settings"
              label={t("settings")}
              iconColor={Colors.icon.green}
              iconBg={Colors.pastel.green}
              onPress={() => router.push("/(settings)/app-settings")}
              isDark={isDark}
              border={border}
              text={textColor}
            />
            <MenuItem
              icon="lock"
              label={t("changePassword")}
              iconColor={Colors.icon.orange}
              iconBg={Colors.pastel.orange}
              onPress={() => router.push("/(settings)/change-password")}
              isDark={isDark}
              border={border}
              text={textColor}
            />
            {/* <MenuItem
              icon="bell"
              label={t("notifications")}
              iconColor={Colors.icon.purple}
              iconBg={Colors.pastel.purple}
              onPress={() => router.push("/notifications")}
              isDark={isDark}
              border={border}
              text={textColor}
              isLast
            /> */}
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <View style={[styles.menuCard, {
            backgroundColor: colors.surface,
            shadowColor: isDark ? "#000" : "rgba(0,0,0,0.06)",
          }]}>
            <MenuItem
              icon="info"
              label={t("about")}
              iconColor={Colors.icon.blue}
              iconBg={Colors.pastel.blue}
              onPress={() => router.push("/(settings)/about")}
              isDark={isDark}
              border={border}
              text={textColor}
            />
            <MenuItem
              icon="file-text"
              label={t("terms")}
              iconColor={Colors.icon.teal}
              iconBg={Colors.pastel.teal}
              onPress={() => router.push("/(settings)/terms")}
              isDark={isDark}
              border={border}
              text={textColor}
            />
            <MenuItem
              icon="shield"
              label={t("privacy")}
              iconColor={Colors.icon.blue}
              iconBg={Colors.pastel.blue}
              onPress={() => router.push("/(settings)/privacy")}
              isDark={isDark}
              border={border}
              text={textColor}
            />
            <MenuItem
              icon="trash-2"
              label={t("deleteAccount")}
              iconColor={Colors.icon.red}
              iconBg={Colors.pastel.red}
              onPress={() => router.push("/(settings)/delete-account")}
              isDark={isDark}
              border={border}
              text={textColor}
              isLast
            />
          </View>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View entering={FadeInUp.delay(180).springify()}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Feather name="log-out" size={18} color="#E53935" />
            <Text style={styles.signOutText}>{t("logout")}</Text>
          </Pressable>
        </Animated.View>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          {t("version")} {t("appVersion")}
        </Text>
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
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  editHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  profileCard: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
    gap: 8,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.pastel.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  profileRole: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  menuCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  menuSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDECEA",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#E53935",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
});
