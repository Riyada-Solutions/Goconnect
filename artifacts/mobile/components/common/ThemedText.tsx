import React from "react";
import { Text, TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface ThemedTextProps extends TextProps {
  variant?: "default" | "secondary" | "tertiary" | "heading" | "subheading" | "caption";
}

export function ThemedText({ variant = "default", style, ...props }: ThemedTextProps) {
  const { colors } = useTheme();

  const color =
    variant === "secondary"
      ? colors.textSecondary
      : variant === "tertiary"
        ? colors.textTertiary
        : colors.text;

  const fontSize =
    variant === "heading"
      ? 24
      : variant === "subheading"
        ? 18
        : variant === "caption"
          ? 12
          : 15;

  const fontWeight =
    variant === "heading"
      ? ("700" as const)
      : variant === "subheading"
        ? ("600" as const)
        : ("400" as const);

  return (
    <Text
      style={[{ color, fontSize, fontWeight, fontFamily: "Inter_400Regular" }, style]}
      {...props}
    />
  );
}
