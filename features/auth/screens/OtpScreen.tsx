import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { authRepository } from "@/features/auth/services/authApi";

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;
  const { t, isDark } = useApp();
  const colors = isDark ? Colors.dark : Colors.light;
  const s = makeStyles(colors);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  function handleOtpChange(text: string, index: number) {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  }

  async function handleVerify() {
    setLoading(true);
    try {
      const code = otp.join("");
      await authRepository.verifyOtp(code);
      router.push("/(auth)/new-password");
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.container, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="chevron-left" size={22} color={Colors.primary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{t("otpVerification")}</Text>
          <Text style={s.headerSub}>{t("enterSixDigit")}</Text>
        </View>
      </View>

      <View style={s.body}>
        <View style={s.iconCard}>
          <View style={s.iconCircle}>
            <Feather name="shield" size={32} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>{t("verifyCode")}</Text>
          <Text style={s.cardSub}>{t("verifyCodeDesc")}</Text>
        </View>

        <View style={s.formCard}>
          <View style={s.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputs.current[i] = ref; }}
                style={[s.otpInput, digit ? s.otpInputFilled : null]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text.slice(-1), i)}
                keyboardType="number-pad"
                maxLength={1}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace" && !digit && i > 0) inputs.current[i - 1]?.focus();
                }}
              />
            ))}
          </View>
          <Pressable style={[s.verifyBtn, loading && { opacity: 0.6 }]} onPress={handleVerify} disabled={loading}>
            <Text style={s.verifyBtnText}>{loading ? t("loading") : t("verifyAndContinue")}</Text>
          </Pressable>
          <View style={s.bottomRow}>
            <Pressable><Text style={s.resendText}>{t("resendCode")}</Text></Pressable>
            <Pressable onPress={() => router.back()}><Text style={s.backText}>{t("backToRegister")}</Text></Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: typeof Colors.light | typeof Colors.dark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    header: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginTop: 4, borderWidth: 1, borderColor: colors.border },
    headerCenter: { flex: 1, gap: 4 },
    headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.text },
    headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary },
    body: { gap: 16 },
    iconCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
    cardTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: colors.text, textAlign: "center" },
    cardSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21 },
    formCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    otpRow: { flexDirection: "row", justifyContent: "center", gap: 10 },
    otpInput: { width: 46, height: 54, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 20, color: colors.text },
    otpInputFilled: { borderColor: Colors.primary, backgroundColor: Colors.accentLight, color: Colors.primary },
    verifyBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
    verifyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
    bottomRow: { flexDirection: "row", justifyContent: "space-between" },
    resendText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary },
    backText: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textSecondary },
  });
}
