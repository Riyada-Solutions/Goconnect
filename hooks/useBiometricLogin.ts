import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { useRef, useState } from "react";

import { useApp } from "@/context/AppContext";
import { verifyFace } from "@/data/auth_repository";
import { getFaceToken, setFaceToken } from "@/data/secure_storage";
import { getBiometricErrorMessage } from "@/utils/biometric";

export type BiometricType = "face" | "fingerprint" | "generic";
 
/**
 * Shared biometric login logic used by both LoginScreen and BiometricUnlockScreen.
 *
 * requireSetting – when true the hook checks the @goconnect/biometric AsyncStorage
 *                  key before proceeding (needed on the login screen; the unlock
 *                  screen is only reached when the setting is already confirmed).
 * onSuccess      – called after a successful biometric login (caller handles navigation).
 */
export function useBiometricLogin({
  requireSetting = false,
  onSuccess, 
}: {
  requireSetting?: boolean;
  onSuccess: () => void;
}) {
  const { login, t } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>("generic");
  const inFlightRef = useRef(false);

  /**
   * Check whether biometric login is usable in the current context.
   * Call once on mount; result is stored in `isAvailable`.
   */
  const checkAvailability = async (): Promise<boolean> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) return false;

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("face");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("fingerprint");
      }

      if (requireSetting) {
        const enabled = await AsyncStorage.getItem("@goconnect/biometric");
        if (enabled !== "true") return false;
      }

      const faceToken = await getFaceToken();
      if (!faceToken) return false;

      return true;
    } catch {
      return false;
    }
  };

  /** Trigger the native biometric prompt and, on success, call the API and log in. */
  const trigger = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);

    try {
      if (requireSetting) {
        const enabled = await AsyncStorage.getItem("@goconnect/biometric");
        if (enabled !== "true") {
          setError(t("biometricSetupRequired"));
          return;
        }
      }

      const faceToken = await getFaceToken();
      if (!faceToken) {
        setError("No stored face token. Please sign in with your password first.");
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      if (hasFace) setBiometricType("face");
      else if (hasFingerprint) setBiometricType("fingerprint");

      const promptMessage = hasFace
        ? t("faceIdLogin")
        : hasFingerprint
        ? t("fingerprintLogin")
        : t("biometricLogin");

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: t("usePasscode"),
        disableDeviceFallback: false,
        cancelLabel: t("cancel"),
      });

      if (!result.success) {
        const err = "error" in result ? result.error : "unknown";
        const warning = "warning" in result ? (result as any).warning : undefined;
        if (err === "missing_usage_description") {
          setError(getBiometricErrorMessage(err, t as (key: string) => string));
          return;
        }
        setError(
          getBiometricErrorMessage(err, t as (key: string) => string) +
            (warning ? ` (${warning})` : "") +
            (err === "not_enrolled" || err === "not_available"
              ? " Enable Face ID for this app in iOS Settings → Face ID & Passcode → Other Apps."
              : err === "user_cancel" || err === "system_cancel"
              ? " Tap the button to retry."
              : ""),
        );
        return;
      }

      setLoading(true);
      const { accessToken, user } = await verifyFace({ face_token: faceToken });
      await login(user, accessToken);
      if (user.face_token) await setFaceToken(user.face_token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(`${t("biometricFailed")}${e?.message ? ` — ${e.message}` : ""}`);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  return {
    trigger,
    loading,
    error,
    setError,
    isAvailable,
    setIsAvailable,
    biometricType,
    checkAvailability,
  };
}
