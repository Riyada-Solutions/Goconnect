import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Logo from "@/assets/svg/logo.svg";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { login as authLogin } from "@/data/auth_repository";
import { getFaceToken, setFaceToken } from "@/data/secure_storage";
import { useBiometricLogin } from "@/hooks/useBiometricLogin";

export default function LoginScreen() {
  const { login, t, appSettings } = useApp();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const {
    trigger: triggerBiometric,
    loading: bioLoading,
    error: bioError,
    setError: setBioError,
    isAvailable: biometricAvailable,
    setIsAvailable: setBiometricAvailable,
    biometricType,
  } = useBiometricLogin({
    requireSetting: true,
    onSuccess: () => router.replace("/(tabs)/home"),
  });

  // Clear stale bio error when app resumes from background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setBioError(null);
    });
    return () => sub.remove();
  }, []);

  // On mount: show button + auto-trigger exactly like BiometricUnlockScreen
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const enabled = await AsyncStorage.getItem("@goconnect/biometric");
        const faceToken = await getFaceToken();
        if (cancelled) return;
        const hasSetup = enabled === "true" && !!faceToken;
        setBiometricAvailable(hasSetup);
        // Always auto-trigger when biometric is set up.
        // authenticateAsync with disableDeviceFallback:false handles the full
        // chain: Face ID → fingerprint → device PIN — whichever is available.
        if (hasSetup) {
          void triggerBiometric();
        }
      } catch (e) {
        console.warn("[login] biometric init", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = t("usernameRequired");
    if (!password.trim()) newErrors.password = t("passwordRequired");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      const firebase_token = await AsyncStorage.getItem("@goconnect/fcm_token");
      const { accessToken, user } = await authLogin({ username, password, firebase_token });
      await login(user, accessToken);
      const biometricEnabled =
        (await AsyncStorage.getItem("@goconnect/biometric")) === "true";
      if (biometricEnabled && user.face_token) {
        await setFaceToken(user.face_token);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ password: t("invalidCredentials") });
    } finally {
      setLoading(false);
    }
  };

  const biometricIcon =
    biometricType === "face" ? (
      <MaterialCommunityIcons name="face-recognition" size={22} color="#fff" />
    ) : biometricType === "fingerprint" ? (
      <MaterialCommunityIcons name="fingerprint" size={22} color="#fff" />
    ) : (
      <Feather name="smartphone" size={20} color="#fff" />
    );

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
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
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
              <Logo width={48} height={48} />
            </View>
            <View style={styles.logoPulse} />
          </View>
          <Text style={styles.brandName}>GoConnect</Text>
          <Text style={styles.brandSubtitle}>KSA Healthcare Platform</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.card}
        >
          <Text style={styles.title}>{t("welcome")}</Text>
          <Text style={styles.subtitle}>{t("signInSubtitle")}</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t("username")}</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.username && styles.inputError,
              ]}
            >
              <Feather name="user" size={18} color={errors.username ? Colors.light.error : "#64748B"} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  setErrors((e) => ({ ...e, username: undefined }));
                }}
                placeholder={t("enterUsername")}
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{t("password")}</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password && styles.inputError,
              ]}
            >
              <Feather name="lock" size={18} color={errors.password ? Colors.light.error : "#64748B"} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrors((e) => ({ ...e, password: undefined }));
                }}
                placeholder={t("enterPassword")}
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color="#64748B"
                />
              </Pressable>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <Pressable onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>{t("forgotPassword")}</Text>
          </Pressable>

          {/* Sign In row — biometric icon button sits beside the Sign In button */}
          <View style={styles.signInRow}>
            <Animated.View style={[buttonStyle, { flex: 1 }]}>
              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                onPressIn={() => { buttonScale.value = withSpring(0.97); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                disabled={loading}
              >
                <LinearGradient
                  colors={[Colors.primaryLight, Colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <Text style={styles.buttonText}>{t("signingIn")}</Text>
                  ) : (
                    <>
                      <Text style={styles.buttonText}>{t("signIn")}</Text>
                      <Feather name="arrow-right" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {biometricAvailable && (
              <Pressable
                onPress={triggerBiometric}
                disabled={bioLoading || loading}
                style={({ pressed }) => [
                  styles.biometricIconBtn,
                  (pressed || bioLoading) && { opacity: 0.7 },
                ]}
              >
                <LinearGradient
                  colors={[Colors.primaryLight, Colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.biometricIconGradient}
                >
                  {bioLoading ? (
                    <ActivityIndicator color="#fff" size={20} />
                  ) : (
                    biometricIcon
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </View>

          {/* Biometric error / info */}
          {bioError ? (
            <View style={styles.bioErrorBox}>
              <Feather name="alert-circle" size={14} color="#92400E" />
              <Text style={styles.bioErrorText}>{bioError}</Text>
            </View>
          ) : null}
        </Animated.View>

        {appSettings.allowRegister && (
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.registerRow}
          >
            <Text style={styles.registerText}>{t("dontHaveAccount")} </Text>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.registerLink}>{t("createAccount")}</Text>
            </Pressable>
          </Animated.View>
        )}

        {appSettings.allowGuestMode && (
          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            style={styles.guestRow}
          >
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                const guestUser = {
                  id: "guest",
                  name: t("guest"),
                  role: "guest",
                  email: "",
                  hospital: null,
                  phone: null,
                  department: null,
                  employeeId: "guest",
                };
                login(guestUser as any, "guest-token").then(() => {
                  router.replace("/(tabs)/home");
                });
              }}
              style={({ pressed }) => [
                styles.guestBtn,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Feather name="user" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.guestText}>{t("continueAsGuest")}</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          style={styles.footer}
        >
          <Text style={styles.footerText}>{t("secureData")}</Text>
          <Feather name="shield" size={14} color="rgba(255,255,255,0.4)" />
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
    marginBottom: 40,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(11,123,139,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(19,168,189,0.5)",
  },
  logoPulse: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "rgba(19,168,189,0.2)",
  },
  brandName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
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
    marginBottom: 28,
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
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginTop: 8,
  },
  button: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
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
  biometricIconBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  biometricIconGradient: {
    width: 54,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bioErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  bioErrorText: {
    fontSize: 12,
    color: "#92400E",
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  registerLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  guestRow: {
    alignItems: "center",
    marginTop: 16,
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  guestText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "Inter_400Regular",
  },
});
