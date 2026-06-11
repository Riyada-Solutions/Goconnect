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

import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import { useApp } from "@/context/AppContext";
import { deleteAccount } from "@/data/auth_repository";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";


export default function DeleteAccountScreen() {
  const { logout, can, t } = useApp();
  const CONSEQUENCES = [
    { icon: "users", text: t("deleteConsequence1") },
    { icon: "calendar", text: t("deleteConsequence2") },
    { icon: "settings", text: t("deleteConsequence3") },
    { icon: "shield-off", text: t("deleteConsequence4") },
  ];
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const canDeleteAccount = can("delete_account");
  const canSubmit = canDeleteAccount && confirm === "DELETE" && password.length > 0;

  const handleDelete = () => {
    if (!canSubmit) return;
    showDialog({
      variant: "confirm",
      title: t("deleteAccount"),
      message: t("deleteAccountWarning"),
      primaryAction: {
        label: t("deleteAccount"),
        destructive: true,
        onPress: async () => {
          setLoading(true);
          setPasswordError("");
          try {
            await deleteAccount(password);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
            router.replace("/(auth)/login");
          } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setPasswordError(
              err instanceof Error ? err.message : t("deleteAccountFailed"),
            );
          } finally {
            setLoading(false);
          }
        },
      },
      secondaryAction: { label: t("cancel"), onPress: () => {} },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FeedbackDialog {...dialogProps} />
      <View
        style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}
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
          <Text style={[styles.title, { color: colors.text }]}>{t("deleteAccount")}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>{t("permanentAction")}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View style={styles.warningBanner}>
            <View style={styles.warningIcon}>
              <Feather name="alert-triangle" size={28} color="#E53935" />
            </View>
            <Text style={styles.warningTitle}>{t("deleteWarningTitle")}</Text>
            <Text style={styles.warningText}>{t("deleteWarningText")}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t("whatWillBeDeleted")}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {CONSEQUENCES.map((c, i) => (
              <View
                key={c.icon}
                style={[
                  styles.consequenceRow,
                  i < CONSEQUENCES.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                  },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: Colors.pastel.red }]}>
                  <Feather
                    name={c.icon as keyof typeof Feather.glyphMap}
                    size={16}
                    color={Colors.icon.red}
                  />
                </View>
                <Text style={[styles.consequenceText, { color: colors.text }]}>{c.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {canDeleteAccount ? (
          <Animated.View entering={FadeInDown.delay(140).springify()}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t("confirmDeletion")}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, gap: 12, padding: 16 }]}>
              <View>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                  {t("password")}
                </Text>
                <TextInput
                  style={[
                    styles.confirmInput,
                    {
                      color: colors.text,
                      borderColor: passwordError ? Colors.light.error : colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setPasswordError("");
                  }}
                  placeholder={t("enterPassword")}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {passwordError ? (
                  <Text style={styles.fieldError}>{passwordError}</Text>
                ) : null}
              </View>
              <View>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                  {t("typeDeleteToConfirm")}
                </Text>
                <TextInput
                  style={[
                    styles.confirmInput,
                    {
                      color: colors.text,
                      borderColor: confirm === "DELETE" ? "#E53935" : colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder={t("typeDeletePlaceholder")}
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </Animated.View>
        ) : (
          <Text style={[styles.noPermission, { color: colors.textSecondary }]}>
            {t("noDeletePermission")}
          </Text>
        )}

        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <Pressable
            onPress={handleDelete}
            disabled={!canSubmit || loading}
            style={({ pressed }) => [
              styles.deleteBtn,
              {
                backgroundColor: canSubmit ? "#E53935" : colors.border,
                opacity: pressed && canSubmit ? 0.8 : 1,
              },
            ]}
          >
            <Feather
              name="trash-2"
              size={18}
              color={canSubmit ? "#fff" : colors.textTertiary}
            />
            <Text
              style={[
                styles.deleteBtnText,
                { color: canSubmit ? "#fff" : colors.textTertiary },
              ]}
            >
              {loading ? t("saving") : t("deleteMyAccount")}
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FDECEA",
    alignItems: "center",
    justifyContent: "center",
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#C62828",
  },
  warningText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#B71C1C",
    textAlign: "center",
    lineHeight: 20,
  },
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
  consequenceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  consequenceText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  confirmLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
  deleteKeyword: { color: "#E53935", fontFamily: "Inter_700Bold" },
  confirmInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  fieldError: {
    fontSize: 12,
    color: Colors.light.error,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  },
  noPermission: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  deleteBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
