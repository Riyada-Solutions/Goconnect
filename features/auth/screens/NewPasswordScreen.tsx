import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { authRepository } from "@/features/auth/services/authApi";

export default function NewPasswordScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;
  const { t, isDark } = useApp();
  const colors = isDark ? Colors.dark : Colors.light;
  const s = makeStyles(colors);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const successScale = useRef(new Animated.Value(0)).current;
  const confirmRef = useRef<TextInput>(null);

  function validate(): boolean {
    if (newPassword.length < 8) { setError(t("passwordMinLength")); return false; }
    if (newPassword !== confirmPassword) { setError(t("passwordMismatch")); return false; }
    return true;
  }

  async function handleSave() {
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await authRepository.resetPassword(newPassword);
      setSuccess(true);
      Animated.spring(successScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    } catch {
      setError(t("passwordUpdateFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={[s.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <Animated.View style={[s.successWrap, { transform: [{ scale: successScale }] }]}>
          <View style={s.successIcon}>
            <Feather name="check" size={40} color="#fff" />
          </View>
          <Text style={s.successTitle}>{t("passwordUpdated")}</Text>
          <Text style={s.successDesc}>{t("passwordUpdatedDesc")}</Text>
          <Pressable style={s.goLoginBtn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={s.goLoginText}>{t("signIn")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="chevron-left" size={22} color={Colors.primary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{t("setNewPassword")}</Text>
          <Text style={s.headerSub}>{t("setNewPasswordTitle")}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: botPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.iconCard}>
          <View style={s.iconCircle}>
            <Feather name="lock" size={32} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>{t("setNewPasswordTitle")}</Text>
          <Text style={s.cardSub}>{t("setNewPasswordDesc")}</Text>
        </View>

        <View style={s.formCard}>
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>{t("newPassword")}</Text>
            <View style={[s.inputWrap, error === t("passwordMinLength") && s.inputError]}>
              <Feather name="lock" size={18} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={t("enterNewPassword")}
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setError(null); }}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <Pressable onPress={() => setShowNew(!showNew)} style={s.eyeBtn}>
                <Feather name={showNew ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>{t("confirmNewPassword")}</Text>
            <View style={[s.inputWrap, error === t("passwordMismatch") && s.inputError]}>
              <Feather name="lock" size={18} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                ref={confirmRef}
                style={s.input}
                placeholder={t("enterConfirmPassword")}
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              <Pressable onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {newPassword.length > 0 && (
            <View style={s.strengthRow}>
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.strengthBar,
                    {
                      backgroundColor:
                        newPassword.length >= 12 ? "#22c55e" :
                        newPassword.length >= 8 ? "#f59e0b" :
                        newPassword.length >= 4 ? "#f97316" : "#ef4444",
                      opacity: i < Math.ceil(newPassword.length / 3) ? 1 : 0.2,
                    },
                  ]}
                />
              ))}
              <Text style={[s.strengthLabel, {
                color:
                  newPassword.length >= 12 ? "#22c55e" :
                  newPassword.length >= 8 ? "#f59e0b" :
                  newPassword.length >= 4 ? "#f97316" : "#ef4444",
              }]}>
                {newPassword.length >= 12 ? t("passwordStrong") : newPassword.length >= 8 ? t("passwordGood") : newPassword.length >= 4 ? t("passwordWeak") : t("passwordTooShort")}
              </Text>
            </View>
          )}

          {error && (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={14} color={colors.error} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[s.saveBtn, loading && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Feather name="check-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.saveBtnText}>{loading ? t("saving") : t("saveNewPassword")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: typeof Colors.light | typeof Colors.dark) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    header: { backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginTop: 4, borderWidth: 1, borderColor: colors.border },
    headerCenter: { flex: 1, gap: 4 },
    headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.text },
    headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary },
    body: { paddingHorizontal: 20, gap: 16 },
    iconCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
    cardTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.text, textAlign: "center" },
    cardSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21 },
    formCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    fieldGroup: { gap: 6 },
    fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
    inputError: { borderColor: colors.error, backgroundColor: "#FFF5F5" },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.text },
    eyeBtn: { padding: 4 },
    strengthRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, minWidth: 60 },
    errorRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF5F5", borderRadius: 10, padding: 10 },
    errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.error, flex: 1 },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center" },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
    successWrap: { alignItems: "center", gap: 16, padding: 24 },
    successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" },
    successTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: colors.text, textAlign: "center" },
    successDesc: { fontFamily: "Inter_400Regular", fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
    goLoginBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48, marginTop: 8 },
    goLoginText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
  });
}
