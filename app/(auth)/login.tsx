import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { login as authLogin, verifyFace } from "@/data/auth_repository";
import { getFaceToken, setFaceToken } from "@/data/secure_storage";
import { getBiometricErrorMessage, isFaceIdSupportedInCurrentBuild } from "@/utils/biometric";

export default function LoginScreen() {
  const { login, t, appSettings } = useApp();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Biometric has its own loading flag so a slow/interrupted Face ID flow can
  // never leave the password Sign In button stuck.
  const [bioLoading, setBioLoading] = useState(false);
  // Guards against two concurrent authenticateAsync calls (the mount
  // auto-prompt + a manual tap) — on iOS the second silently never resolves.
  const authInFlightRef = useRef(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | "generic">("generic");
  const [biometricInfo, setBiometricInfo] = useState<string | null>(null);

  // Returning from background can leave a biometric attempt that was suspended
  // mid-flight (its network promise never settles) — clear the loading state so
  // the screen is usable again on resume.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        authInFlightRef.current = false;
        setBioLoading(false);
        setLoading(false);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        console.log("[biometric] compatible:", compatible, "enrolled:", enrolled);
        if (cancelled) return;

        // Detect the available method just for the button icon/label.
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("face");
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("fingerprint");
        }

        // A saved face login exists when the user enabled biometric and we
        // stored their face_token. The token is preserved across logout, so the
        // button reappears on the login screen after signing out.
        const enabled = (await AsyncStorage.getItem("@goconnect/biometric")) === "true";
        const faceToken = await getFaceToken();
        const hasSavedFaceLogin = enabled && !!faceToken;
        console.log("[biometric] enabled:", enabled, "hasToken:", !!faceToken);

        // Show the button (and auto-prompt) whenever a saved face login exists
        // and the current build can show the native prompt.
        const canPrompt = hasSavedFaceLogin && isFaceIdSupportedInCurrentBuild();
        setBiometricReady(canPrompt);
        if (canPrompt) {
          // Delay so the screen is fully interactive before the native prompt —
          // calling authenticateAsync during a cold launch can otherwise fail
          // to present the Face ID sheet on iOS.
          setTimeout(() => {
            if (!cancelled) void handleBiometricLogin();
          }, 500);
        }
      } catch (e) {
        console.warn("[biometric] init error", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBiometricLogin = async () => {
    if (authInFlightRef.current) {
      console.log("[biometric] already in flight — ignoring duplicate trigger");
      return;
    }
    authInFlightRef.current = true;
    console.log("[biometric] button pressed");
    setBiometricInfo(null);
    try {
      const enabled =
        (await AsyncStorage.getItem("@goconnect/biometric")) === "true";
      const faceToken = await getFaceToken();
      console.log("[biometric] press → enabled:", enabled, "hasToken:", !!faceToken);
      if (!enabled || !faceToken) {
        setBiometricInfo(t("biometricSetupRequired"));
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFace = types.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      );
      const hasFingerprint = types.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      );

      // Priority chain (handled automatically by the OS): Face ID → Fingerprint
      // → device passcode. With disableDeviceFallback: false the OS prompts the
      // enrolled biometric and falls back to the passcode if it fails or none
      // is enrolled.
      const promptMessage = hasFace
        ? t("faceIdLogin")
        : hasFingerprint
        ? t("fingerprintLogin")
        : t("biometricLogin");

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: t("usePasscode"),
        cancelLabel: t("cancel"),
        disableDeviceFallback: false,
      });
      console.log("[biometric] auth result:", result);
      if (!result.success) {
        if ("error" in result && result.error) {
          setBiometricInfo(getBiometricErrorMessage(result.error, t));
        }
        return;
      }
      setBioLoading(true);
      const { accessToken, user } = await verifyFace({ face_token: faceToken });
      await login(user, accessToken);
      if (user.face_token) await setFaceToken(user.face_token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      console.warn("[biometric] error", e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setBiometricInfo(`${t("biometricFailed")}${e?.message ? ` — ${e.message}` : ""}`);
    } finally {
      setBioLoading(false);
      authInFlightRef.current = false;
    }
  };

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
      const { accessToken, user } = await authLogin({ username, password });
      await login(user, accessToken);
      // Persist face_token for next-time face login when the user has the
      // biometric setting enabled.
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
                onChangeText={(t) => {
                  setUsername(t);
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
                onChangeText={(t) => {
                  setPassword(t);
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

          <Animated.View style={buttonStyle}>
            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              onPressIn={() => {
                buttonScale.value = withSpring(0.97);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1);
              }}
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

          {biometricReady && (
            <Pressable
              onPress={handleBiometricLogin}
              disabled={bioLoading}
              style={({ pressed }) => [
                styles.biometricBtn,
                (pressed || bioLoading) && { opacity: 0.7 },
              ]}
            >
              {bioLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  {biometricType === "face" ? (
                    <MaterialCommunityIcons name="face-recognition" size={22} color={Colors.primary} />
                  ) : biometricType === "fingerprint" ? (
                    <MaterialCommunityIcons name="fingerprint" size={22} color={Colors.primary} />
                  ) : (
                    <Feather name="smartphone" size={20} color={Colors.primary} />
                  )}
                  <Text style={styles.biometricText}>
                    {biometricType === "face"
                      ? t("faceIdLogin")
                      : biometricType === "fingerprint"
                      ? t("fingerprintLogin")
                      : t("biometricLogin")}
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {biometricInfo && (
            <View
              style={{
                backgroundColor: "#FEF3C7",
                borderRadius: 10,
                padding: 10,
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#92400E",
                  fontFamily: "Inter_500Medium",
                  textAlign: "center",
                }}
              >
                {biometricInfo}
              </Text>
            </View>
          )}
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
          <Text style={styles.footerText}>
            {t("secureData")}
          </Text>
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
  button: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
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
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.pastel.teal,
    backgroundColor: "#F0FBFD",
  },
  biometricText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
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
