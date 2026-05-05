import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { changePassword } from "@/data/auth_repository";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  colors: any;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderColor: error ? Colors.light.error : colors.border,
          },
        ]}
      >
        <Feather name="lock" size={18} color={error ? Colors.light.error : colors.textTertiary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          autoCapitalize="none"
          placeholderTextColor={colors.textTertiary}
          placeholder="••••••••"
        />
        <Pressable onPress={onToggle}>
          <Feather name={show ? "eye-off" : "eye"} size={18} color={colors.textTertiary} />
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!current) e.current = "Current password is required";
    if (!newPass || newPass.length < 8) e.newPass = "Password must be at least 8 characters";
    if (newPass !== confirm) e.confirm = "Passwords do not match";
    if (Object.keys(e).length > 0) {
      setErrors(e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await changePassword({ currentPassword: current, newPassword: newPass });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog({
        variant: "success",
        title: "Password Changed",
        message: "Your password has been updated successfully.",
        primaryAction: { label: "OK", onPress: () => router.back() },
      });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ current: "Failed to change password. Please check your current password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FeedbackDialog {...dialogProps} />
      <View
        style={[styles.header, {
          paddingTop: topPad + 12,
          backgroundColor: colors.background,
        }]}
      >
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t("changePassword")}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Update your password</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: botPad + 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Lock icon top */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.iconTop}>
          <View style={[styles.lockCircle, { backgroundColor: Colors.pastel.orange }]}>
            <Feather name="lock" size={36} color={Colors.icon.orange} />
          </View>
          <Text style={[styles.iconTopText, { color: colors.textSecondary }]}>
            Choose a strong password with at least 8 characters
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <PasswordField
            label="Current Password"
            value={current}
            onChange={(v) => { setCurrent(v); setErrors((e) => ({ ...e, current: "" })); }}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            error={errors.current}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <PasswordField
            label="New Password"
            value={newPass}
            onChange={(v) => { setNewPass(v); setErrors((e) => ({ ...e, newPass: "" })); }}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            error={errors.newPass}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <PasswordField
            label="Confirm New Password"
            value={confirm}
            onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: "" })); }}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            error={errors.confirm}
            colors={colors}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: Colors.primary, opacity: loading ? 0.7 : pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>
              {loading ? "Saving..." : "Update Password"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  iconTop: { alignItems: "center", gap: 12, paddingVertical: 8 },
  lockCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
  },
  iconTopText: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    textAlign: "center", maxWidth: 260,
  },
  card: {
    borderRadius: 16, paddingHorizontal: 16,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  fieldContainer: { paddingVertical: 14, gap: 6 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 12, gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  errorText: { fontSize: 12, color: Colors.light.error, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginLeft: 0 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, gap: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
