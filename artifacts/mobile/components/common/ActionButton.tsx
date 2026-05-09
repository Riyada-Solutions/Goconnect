import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Linking, Platform, Pressable, StyleSheet, Text } from "react-native";

import { useApp } from "@/context/AppContext";
import type { RuleAction } from "@/data/models/rules";
import { Colors } from "@/theme/colors";

export type ActionButtonType = "call" | "location" | "labResults";

const RULE_FOR: Record<ActionButtonType, RuleAction> = {
  call: "call_patient",
  location: "navigate_to_patient_address",
  labResults: "view_lab_results",
};

type ActionButtonProps = {
  type: ActionButtonType;
  value: string | number;
};

const ICON: Record<ActionButtonType, keyof typeof Feather.glyphMap> = {
  call: "phone",
  location: "map-pin",
  labResults: "file-text",
};

const COLORS: Record<ActionButtonType, { bg: string; fg: string }> = {
  call: { bg: "#DCFCE7", fg: "#16A34A" },       // green
  location: { bg: "#DBEAFE", fg: "#2563EB" },   // blue
  labResults: { bg: "#F3E8FF", fg: "#7C3AED" }, // purple
};

export function ActionButton({ type, value }: ActionButtonProps) {
  const { t, can } = useApp();
  const palette = COLORS[type];

  if (!can(RULE_FOR[type])) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === "call") {
      const url = `tel:${String(value).replace(/\s/g, "")}`;
      Linking.canOpenURL(url).then((ok) => (ok ? Linking.openURL(url) : null));
    } else if (type === "location") {
      const query = encodeURIComponent(String(value));
      const url = Platform.select({
        ios: `maps:?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://maps.google.com/?q=${query}`,
      });
      Linking.openURL(url!);
    } else {
      // labResults — navigate to the list screen for this patient
      router.push({
        pathname: "/lab-results/[patientId]",
        params: { patientId: String(value) },
      });
    }
  };

  if (type === "labResults") {
    return (
      <Pressable
        onPress={handlePress}
        style={[s.pillBtn, { backgroundColor: palette.bg }]}
      >
        <Feather name={ICON[type]} size={13} color={palette.fg} />
        <Text style={[s.label, { color: palette.fg }]}>{t("labResults")}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[s.iconBtn, { backgroundColor: palette.bg }]}
    >
      <Feather name={ICON[type]} size={15} color={palette.fg} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
