import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { register } from "@/data/auth_repository";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;
  const { t, isDark } = useApp();
  const colors = isDark ? Colors.dark : Colors.light;
  const [registerCode, setRegisterCode] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const s = makeStyles(colors);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register({
        registerCode,
        phone,
        username,
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push({ pathname: "/(auth)/otp", params: { email, purpose: "register" } });
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
          <Text style={s.headerTitle}>{t("createYourAccount")}</Text>
          <Text style={s.headerSub}>{t("registerDesc")}</Text>
        </View>
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: botPad + 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.cardTag}>{t("joinGoConnect")}</Text>
          <Text style={s.cardTitle}>{t("createYourAccount")}</Text>
          <Text style={s.cardSub}>{t("registerDesc")}</Text>
        </View>

        <View style={s.formCard}>
          {[
            { icon: "key" as const, placeholder: t("registerCode"), value: registerCode, onChange: setRegisterCode },
            { icon: "phone" as const, placeholder: t("phone"), value: phone, onChange: setPhone, keyboard: "phone-pad" as const },
            { icon: "user" as const, placeholder: t("username"), value: username, onChange: setUsername },
            { icon: "user" as const, placeholder: t("fullName"), value: name, onChange: setName },
            { icon: "mail" as const, placeholder: t("emailAddress"), value: email, onChange: setEmail, keyboard: "email-address" as const },
          ].map((field, i) => (
            <View key={i} style={s.inputWrap}>
              <Feather name={field.icon} size={18} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textSecondary}
                value={field.value}
                onChangeText={field.onChange}
                keyboardType={field.keyboard || "default"}
                autoCapitalize="none"
              />
            </View>
          ))}

          {/* Password */}
          <View style={s.inputWrap}>
            <Feather name="lock" size={18} color={colors.textSecondary} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder={t("password")}
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Confirm password */}
          <View style={s.inputWrap}>
            <Feather name="lock" size={18} color={colors.textSecondary} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder={t("confirmPassword") || "Confirm password"}
              placeholderTextColor={colors.textSecondary}
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowConfirm((v) => !v)}>
              <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Pressable style={[s.registerBtn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            <Text style={s.registerBtnText}>{loading ? t("loading") : t("register")}</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={s.loginLink}>{t("alreadyHaveAccount")} {t("signIn")}</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    body: { flex: 1, paddingHorizontal: 20 },
    card: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, gap: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTag: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: Colors.primary, letterSpacing: 1.5 },
    cardTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.text, lineHeight: 28 },
    cardSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
    formCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.text },
    registerBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 4 },
    registerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
    loginLink: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 4 },
  });
}
