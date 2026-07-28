import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Logo from "@/assets/svg/logo.svg";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { changePassword } from "@/data/auth_repository";
import { PasswordRequirements, isPasswordValid } from "@/components/common/PasswordRequirements";

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <Feather name="lock" size={18} color={error ? Colors.light.error : "#64748B"} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="••••••••"
          placeholderTextColor="#94A3B8"
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <Pressable onPress={onToggle}>
          <Feather name={show ? "eye-off" : "eye"} size={18} color="#64748B" />
        </Pressable>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function PasswordExpiredScreen() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const { accessToken } = useLocalSearchParams<{ accessToken?: string }>();

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
    if (!current) e.current = t("currentPasswordRequired");
    if (!newPass || !isPasswordValid(newPass)) e.newPass = t("passwordInvalid");
    if (newPass !== confirm) e.confirm = t("passwordMismatch");
    if (Object.keys(e).length > 0) {
      setErrors(e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await changePassword({ currentPassword: current, newPassword: newPass }, accessToken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(auth)/login");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ current: t("failedChangePassword") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#0A1628", "#0B7B8B", "#0A1628"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24),
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.brandContainer}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Logo width={40} height={40} />
            </View>
          </View>
          <Text style={styles.brandName}>CareConnect</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.card}
        >
          <Text style={styles.title}>{t("passwordExpiredTitle")}</Text>
          <Text style={styles.subtitle}>{t("passwordExpiredSubtitle")}</Text>

          <View style={styles.warningBox}>
            <Feather name="alert-triangle" size={16} color="#92400E" />
            <Text style={styles.warningText}>{t("passwordExpiredWarning")}</Text>
          </View>

          <PasswordField
            label={t("currentPassword")}
            value={current}
            onChange={(v) => { setCurrent(v); setErrors((e) => ({ ...e, current: "" })); }}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            error={errors.current}
          />
          <PasswordField
            label={t("newPassword")}
            value={newPass}
            onChange={(v) => { setNewPass(v); setErrors((e) => ({ ...e, newPass: "" })); }}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            error={errors.newPass}
          />
          {newPass.length > 0 && (
            <View style={{ paddingHorizontal: 4, marginTop: -8, marginBottom: 18 }}>
              <PasswordRequirements password={newPass} />
            </View>
          )}
          <PasswordField
            label={t("confirmNewPassword")}
            value={confirm}
            onChange={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: "" })); }}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            error={errors.confirm}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={[Colors.primaryLight, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <Text style={styles.buttonText}>{t("saving")}</Text>
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.buttonText}>{t("updatePassword")}</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    minHeight: "100%",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(11,123,139,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(19,168,189,0.5)",
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#0F1923",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF3E7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#92400E",
    lineHeight: 18,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputError: {
    borderColor: Colors.light.error,
    backgroundColor: "#FFF5F5",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#0F1923",
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  button: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
