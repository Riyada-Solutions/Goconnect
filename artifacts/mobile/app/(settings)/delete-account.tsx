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
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";

const CONSEQUENCES = [
  { icon: "users", text: "All your patient data will be permanently deleted" },
  { icon: "calendar", text: "All scheduled visits and history will be lost" },
  { icon: "settings", text: "Your account settings and preferences will be removed" },
  { icon: "shield-off", text: "You will lose access to all GoConnect services" },
];

export default function DeleteAccountScreen() {
  const { logout, t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const canDelete = confirm === "DELETE";

  const handleDelete = () => {
    if (!canDelete) return;
    showDialog({
      variant: "confirm",
      title: "Delete Account",
      message: "This action is permanent and cannot be undone. Are you absolutely sure?",
      primaryAction: {
        label: "Delete",
        destructive: true,
        onPress: async () => {
          setLoading(true);
          await new Promise((r) => setTimeout(r, 1500));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/(auth)/login");
        },
      },
      secondaryAction: { label: "Cancel", onPress: () => {} },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FeedbackDialog {...dialogProps} />
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t("deleteAccount")}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Permanent action</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Warning banner */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View style={styles.warningBanner}>
            <View style={styles.warningIcon}>
              <Feather name="alert-triangle" size={28} color="#E53935" />
            </View>
            <Text style={styles.warningTitle}>Warning: Irreversible Action</Text>
            <Text style={styles.warningText}>
              Deleting your account is permanent. All your data will be erased and cannot be recovered.
            </Text>
          </View>
        </Animated.View>

        {/* Consequences */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>WHAT WILL BE DELETED</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {CONSEQUENCES.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.consequenceRow,
                  i < CONSEQUENCES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: Colors.pastel.red }]}>
                  <Feather name={c.icon as any} size={16} color={Colors.icon.red} />
                </View>
                <Text style={[styles.consequenceText, { color: colors.text }]}>{c.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Confirmation input */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONFIRM DELETION</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={{ padding: 4 }}>
              <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                Type <Text style={{ color: "#E53935", fontFamily: "Inter_700Bold" }}>DELETE</Text> to confirm
              </Text>
              <TextInput
                style={[
                  styles.confirmInput,
                  {
                    color: colors.text,
                    borderColor: canDelete ? "#E53935" : colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Type DELETE here"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </Animated.View>

        {/* Delete button */}
        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <Pressable
            onPress={handleDelete}
            disabled={!canDelete || loading}
            style={({ pressed }) => [
              styles.deleteBtn,
              {
                backgroundColor: canDelete ? "#E53935" : colors.border,
                opacity: pressed && canDelete ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="trash-2" size={18} color={canDelete ? "#fff" : colors.textTertiary} />
            <Text style={[styles.deleteBtnText, { color: canDelete ? "#fff" : colors.textTertiary }]}>
              {loading ? "Deleting..." : "Delete My Account"}
            </Text>
          </Pressable>
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
  warningBanner: {
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  warningIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#FDECEA",
    alignItems: "center", justifyContent: "center",
  },
  warningTitle: {
    fontSize: 16, fontFamily: "Inter_700Bold", color: "#C62828",
  },
  warningText: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: "#B71C1C", textAlign: "center", lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  card: {
    borderRadius: 16, paddingHorizontal: 16,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  consequenceRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, gap: 14,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  consequenceText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  confirmLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
  confirmInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, gap: 8,
  },
  deleteBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
