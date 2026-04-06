import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/theme/colors";

interface AvatarProps {
  name?: string;
  size?: number;
  color?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const BG_COLORS = [
  "#0B7B8B",
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export function Avatar({ name, size = 44, color }: AvatarProps) {
  const bg = name ? (color ?? getAvatarColor(name)) : Colors.primary;
  const initials = name ? getInitials(name) : null;
  const fontSize = size * 0.36;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      {initials ? (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      ) : (
        <MaterialIcons name="person" size={size * 0.55} color="#fff" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
});
