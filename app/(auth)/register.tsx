import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { register } from "@/data/auth_repository";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterErrors = {
  registerCode?: string;
  phone?: string;
  username?: string;
  name?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
};

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
  const [errors, setErrors] = useState<RegisterErrors>({});

  const s = makeStyles(colors);

  const clearError = (field: keyof RegisterErrors) =>
    setErrors((e) => ({ ...e, [field]: undefined }));

  const validate = (): boolean => {
    const e: RegisterErrors = {};
    if (!registerCode.trim()) e.registerCode = t("registerCodeRequired");
    if (!phone.trim())        e.phone        = t("phoneRequired");
    if (!username.trim())     e.username     = t("usernameRequired");
    if (!name.trim())         e.name         = t("nameRequired");
    if (!email.trim())        e.email        = t("emailRequired");
    else if (!EMAIL_REGEX.test(email.trim())) e.email = t("emailInvalid");
    if (!password.trim())     e.password     = t("passwordRequired");
    else if (password.length < 8) e.password = t("passwordMinLength");
    if (!passwordConfirmation.trim()) e.passwordConfirmation = t("passwordRequired");
    else if (password !== passwordConfirmation) e.passwordConfirmation = t("passwordMismatch");
    if (Object.keys(e).length > 0) {
      setErrors(e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
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
          {/* Register Code */}
          <View style={s.fieldGroup}>
            <View style={[s.inputWrap, errors.registerCode && s.inputError]}>
              <Feather name="key" size={18} color={errors.registerCode ? colors.error : colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={t("registerCode")}
                placeholderTextColor={colors.textSecondary}
                value={registerCode}
                onChangeText={(v) => { setRegisterCode(v); clearError("registerCode"); }}
                autoCapitalize="none"
              />
            </View>
            {errors.registerCode && <Text style={s.errorText}>{errors.registerCode}</Text>}
          </View>

          {/* Phone */}
          <View style={s.fieldGroup}>
            <View style={[s.inputWrap, errors.phone && s.inputError]}>
              <Feather name="phone" size={18} color={errors.phone ? colors.error : colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={t("phone")}
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={(v) => { setPhone(v); clearError("phone"); }}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}
          </View>

          {/* Username */}
          <View style={s.fieldGroup}>
            <View style={[s.inputWrap, errors.username && s.inputError]}>
              <Feather name="user" size={18} color={errors.username ? colors.error : colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={t("username")}
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={(v) => { setUsername(v); clearError("username"); }}
                autoCapitalize="none"
              />
            </View>
            {errors.username && <Text style={s.errorText}>{errors.username}</Text>}
          </View>

          {/* Full Name */}
          <View style={s.fieldGroup}>
            <View style={[s.inputWrap, errors.name && s.inputError]}>
              <Feather name="user" size={18} color={errors.name ? colors.error : colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={t("fullName")}
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={(v) => { setName(v); clearError("name"); }}
                autoCapitalize="words"
              />
            </View>
            {errors.name && <Text style={s.errorText}>{errors.name}</Text>}
          </View>

          {/* Email */}
          <View style={s.fieldGroup}>
            <View style={[s.inputWrap, errors.email && s.inputError]}>
              <Feather name="mail" size={18} color={errors.email ? colors.error : colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={t("emailAddress")}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={(v) => { setEmail(v); clearError("email"); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={s.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={s.fieldGroup}>
            <View style={[s.inputWrap, errors.password && s.inputError]}>
              <Feather name="lock" size={18} color={errors.password ? colors.error : colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={t("password")}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={(v) => { setPassword(v); clearError("password"); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            {errors.password && <Text style={s.errorText}>{errors.password}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={s.fieldGroup}>
            <View style={[s.inputWrap, errors.passwordConfirmation && s.inputError]}>
              <Feather name="lock" size={18} color={errors.passwordConfirmation ? colors.error : colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder={t("confirmPassword")}
                placeholderTextColor={colors.textSecondary}
                value={passwordConfirmation}
                onChangeText={(v) => { setPasswordConfirmation(v); clearError("passwordConfirmation"); }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowConfirm((v) => !v)}>
                <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            {errors.passwordConfirmation && <Text style={s.errorText}>{errors.passwordConfirmation}</Text>}
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
    fieldGroup: { gap: 4 },
    inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
    inputError: { borderColor: colors.error },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontFamily: "Inter_400Regular", fontSize: 15, color: colors.text },
    errorText: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.error, marginLeft: 4 },
    registerBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 4 },
    registerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
    loginLink: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 4 },
  });
}
