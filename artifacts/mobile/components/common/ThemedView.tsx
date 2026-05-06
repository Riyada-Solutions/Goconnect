import React from "react";
import { View, ViewProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface ThemedViewProps extends ViewProps {
  variant?: "default" | "surface" | "card" | "elevated";
}

export function ThemedView({
  variant = "default",
  style,
  ...props
}: ThemedViewProps) {
  const { colors } = useTheme();

  const bg =
    variant === "surface"
      ? colors.surface
      : variant === "card"
        ? colors.card
        : variant === "elevated"
          ? colors.surfaceElevated
          : colors.background;

  return <View style={[{ backgroundColor: bg }, style]} {...props} />;
}
