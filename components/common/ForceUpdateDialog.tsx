import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { BackHandler, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { Colors } from "@/theme/colors";
import { openAppStore } from "@/utils/openAppStore";

/**
 * Full-screen force-update gate. Uses a native Modal so it sits above the
 * navigation stack (home header / settings gear cannot show through).
 */
export function ForceUpdateDialog() {
  const { t } = useApp();

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <LinearGradient
        colors={["#14D0E8", "#0FB8D0", "#0A8FA6", "#065F74"]}
        style={styles.screen}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="download" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{t("forceUpdateTitle")}</Text>
          <Text style={styles.message}>{t("forceUpdateMessage")}</Text>
          <Pressable style={styles.btn} onPress={openAppStore}>
            <Text style={styles.btnText}>{t("forceUpdateButton")}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B7A90",
    textAlign: "center",
    lineHeight: 21,
  },
  btn: {
    marginTop: 24,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
