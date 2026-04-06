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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
  colors: any;
}

function InfoRow({ icon, label, value, isLast, colors }: InfoRowProps) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={[styles.infoIcon, { backgroundColor: Colors.pastel.teal }]}>
          <Feather name={icon as any} size={16} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{value || "—"}</Text>
        </View>
      </View>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
    </>
  );
}

export default function ProfileScreen() {
  const { user, t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t("myProfile")}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Your account details</Text>
        </View>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.push("/(settings)/edit-profile"); }}
          style={[styles.editBtn, { backgroundColor: Colors.pastel.teal }]}
        >
          <Feather name="edit-2" size={16} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar card */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
            <View style={styles.avatarCircle}>
              <Feather name="user" size={40} color={Colors.primary} />
            </View>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name ?? "—"}</Text>
            <Text style={[styles.profileRole, { color: colors.textSecondary }]}>{user?.role ?? "—"}</Text>

            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push("/(settings)/edit-profile"); }}
              style={[styles.editProfileBtn, { backgroundColor: Colors.primary }]}
            >
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={styles.editProfileBtnText}>{t("editProfile")}</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Account info */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT INFORMATION</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <InfoRow icon="user" label={t("fullName")} value={user?.name ?? ""} colors={colors} />
            <InfoRow icon="mail" label={t("email")} value={user?.email ?? ""} colors={colors} />
            <InfoRow icon="shield" label={t("role")} value={user?.role ?? ""} colors={colors} isLast />
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
  editBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  profileCard: {
    borderRadius: 20, paddingVertical: 28, paddingHorizontal: 20,
    alignItems: "center", gap: 8,
    shadowColor: "rgba(19,168,189,0.12)",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 3,
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.pastel.teal,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  profileRole: { fontSize: 14, fontFamily: "Inter_400Regular" },
  editProfileBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, gap: 6, marginTop: 8,
  },
  editProfileBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  card: {
    borderRadius: 16, paddingHorizontal: 16,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 },
  infoIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  infoLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  infoValue: { fontSize: 15, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginLeft: 52 },
});
