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

  const handleBiometricUnlock = async () => {
    try {
      setError(null);
      const faceToken = await getFaceToken();
      if (!faceToken) {
        // No stored token — fall back to login
        await logout();
        router.replace("/(auth)/login");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("biometricLogin"),
        fallbackLabel: t("cancel"),
      });
      if (!result.success) return;

      setLoading(true);
      const { accessToken, user } = await verifyFace({ face_token: faceToken });
      await login(user, accessToken);
      // Persist the rotated face_token if the backend issued a new one
      if (user.face_token) await setFaceToken(user.face_token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t("biometricFailed"));
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
    void handleBiometricUnlock();
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
            onPress={handleBiometricUnlock}
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
