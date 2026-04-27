import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import BackgroundCare from "@/assets/svg/background-care.svg";
import { useTheme } from "@/hooks/useTheme";

export function ScreenBackground() {
  const { colors } = useTheme();
  return (
    <View style={styles.bg} pointerEvents="none">
      <BackgroundCare
        width="100%"
        height="100%"
        preserveAspectRatio="xMaxYMid slice"
      />
      <LinearGradient
        colors={[
          colors.background,
          `${colors.background}00`,
          `${colors.background}00`,
          colors.background,
        ]}
        locations={[0, 0.18, 0.82, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    // opacity: 0.7,
  },
});
