import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { authRepository } from "@/features/auth/services/authApi";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;
  const { t, isDark } = useApp();
  const colors = isDark ? Colors.dark : Colors.light;
  const s = makeStyles(colors);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await authRepository.sendOtp(email);
      router.push("/(auth)/otp");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="chevron-left" size={22} color={Colors.primary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{t("forgotPasswordTitle")}</Text>
          <Text style={s.headerSub}>{t("resetDesc")}</Text>
        </View>
      </View>

      <View style={[s.body, { paddingBottom: botPad + 24 }]}>
        <View style={s.iconCard}>
          <View style={s.iconCircle}>
            <Feather name="key" size={32} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>{t("resetPassword")}</Text>
          <Text style={s.cardSub}>{t("resetDesc")}</Text>
        </View>

        <View style={s.formCard}>
          <View style={s.inputWrap}>
            <Feather name="mail" size={18} color={colors.textSecondary} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder={t("emailAddress")}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <Pressable style={[s.sendBtn, loading && { opacity: 0.6 }]} onPress={handleSendOtp} disabled={loading}>
            <Text style={s.sendBtnText}>{loading ? t("loading") : t("sendResetLink")}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={s.backToSignIn}>{t("backToLogin")}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: typeof Colors.light | typeof Colors.dark) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginTop: 4, borderWidth: 1, borderColor: colors.border },
    headerCenter: { flex: 1, gap: 4 },
    headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.text },
    headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary },
    body: { flex: 1, paddingHorizontal: 20, gap: 16 },
    iconCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
    cardTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.text, textAlign: "center" },
    cardSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21 },
    formCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.text },
    sendBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
    sendBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
    backToSignIn: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 4 },
  });
}
