import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Logo from "@/assets/svg/logo.svg";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { verifyFace } from "@/data/auth_repository";
import { clearFaceToken, getFaceToken, setFaceToken } from "@/data/secure_storage";

export default function BiometricUnlockScreen() {
  const { login, logout, t } = useApp();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBiometricUnlock = async (forcePasscode = false) => {
    console.log("[bio-unlock] button pressed, forcePasscode:", forcePasscode);
    try {
      setError(null);
      const faceToken = await getFaceToken();
      console.log("[bio-unlock] hasToken:", !!faceToken);
      if (!faceToken) {
        setError("No stored face token. Tap 'Use Password Instead' to login.");
        return;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      console.log("[bio-unlock] compatible:", compatible, "enrolled:", enrolled);

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log("[bio-unlock] supported types:", types);
      const isFace = types.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      );
      const isFingerprint = types.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      );

      const biometricUsable = compatible && enrolled && !forcePasscode;

      console.log("[bio-unlock] calling authenticateAsync, biometricUsable:", biometricUsable);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricUsable
          ? isFace
            ? t("faceIdLogin")
            : isFingerprint
            ? t("fingerprintLogin")
            : t("biometricLogin")
          : t("usePasscode"),
        fallbackLabel: t("usePasscode"),
        disableDeviceFallback: false,
        cancelLabel: t("cancel"),
      });
      console.log("[bio-unlock] auth result:", JSON.stringify(result));
      if (!result.success) {
        const err = "error" in result ? result.error : "unknown";
        const warning = "warning" in result ? result.warning : undefined;
        setError(
          `Auth failed: ${err}${warning ? ` / ${warning}` : ""}. ` +
            (err === "not_enrolled" || err === "not_available"
              ? "Enable Face ID for Expo Go: iOS Settings → Face ID & Passcode → Other Apps → Expo Go."
              : err === "user_cancel" || err === "system_cancel"
              ? "You cancelled. Tap the button to retry."
              : ""),
        );
        return;
      }

      setLoading(true);
      const { accessToken, user } = await verifyFace({ face_token: faceToken });
      await login(user, accessToken);
      if (user.face_token) await setFaceToken(user.face_token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      console.warn("[bio-unlock] error", e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(`${t("biometricFailed")}${e?.message ? ` — ${e.message}` : ""}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUsePassword = async () => {
    Haptics.selectionAsync();
    await clearFaceToken();
    await logout();
    router.replace("/(auth)/login");
  };

  // Auto-prompt on mount
  useEffect(() => {
    void handleBiometricUnlock(false);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#0A1628", "#0B7B8B", "#0A1628"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Branding */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.brand}>
          <View style={styles.logoCircle}>
            <Logo width={52} height={52} />
          </View>
          <View style={styles.logoPulse} />
          <Text style={styles.appName}>GoConnect</Text>
          <Text style={styles.appSub}>KSA Healthcare Platform</Text>
        </Animated.View>

        {/* Lock card */}
        <Animated.View entering={FadeInUp.delay(160).springify()} style={styles.card}>
          <View style={styles.lockIconWrap}>
            <Feather name="lock" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>{t("biometricLogin")}</Text>
          <Text style={styles.cardSub}>{t("biometricSub")}</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={15} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Retry biometric */}
          <Pressable
            onPress={() => handleBiometricUnlock(false)}
            disabled={loading}
            style={({ pressed }) => [styles.bioBtn, pressed && { opacity: 0.8 }]}
          >
            <LinearGradient
              colors={[Colors.primaryLight, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bioBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size={20} />
              ) : (
                <>
                  <Feather name="smartphone" size={18} color="#fff" />
                  <Text style={styles.bioBtnText}>{t("biometricLogin")}</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Use device passcode */}
          <Pressable
            onPress={() => handleBiometricUnlock(true)}
            disabled={loading}
            style={({ pressed }) => [styles.passBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="hash" size={15} color={Colors.primary} />
            <Text style={styles.passBtnText}>{t("usePasscode")}</Text>
          </Pressable>

          {/* Use password instead */}
          <Pressable
            onPress={handleUsePassword}
            disabled={loading}
            style={({ pressed }) => [styles.passBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="log-in" size={15} color={Colors.primary} />
            <Text style={styles.passBtnText}>{t("usePassword")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    gap: 40,
  },
  brand: {
    alignItems: "center",
    gap: 8,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(11,123,139,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(19,168,189,0.5)",
  },
  logoPulse: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -48,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "rgba(19,168,189,0.2)",
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  appSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  lockIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#0F1923",
    textAlign: "center",
  },
  cardSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "stretch",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#B91C1C",
    flex: 1,
  },
  bioBtn: {
    borderRadius: 14,
    overflow: "hidden",
    alignSelf: "stretch",
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bioBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  bioBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  passBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 2,
  },
  passBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
});
