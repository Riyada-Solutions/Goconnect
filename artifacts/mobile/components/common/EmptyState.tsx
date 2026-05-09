import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { Colors } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";

export type EmptyStateVariant = "empty" | "error" | "search" | "success";

interface EmptyStateProps {
  /** Preset color palette. Default: "empty" (primary/teal). */
  variant?: EmptyStateVariant;
  /** Feather icon name. Ignored if `image` is provided. */
  icon?: keyof typeof Feather.glyphMap;
  /** Custom illustration — e.g. `require("@/assets/empty-states/patients.svg")` or a PNG. */
  image?: ImageSourcePropType;
  title: string;
  description?: string;
  /** CTA label. Button is rendered only when both label and onAction are provided. */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary/text-only action (e.g. "Go back"). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  style?: ViewStyle;
}

const VARIANTS: Record<
  EmptyStateVariant,
  { ring: string; halo: string; fg: string }
> = {
  empty: {
    ring: `${Colors.primary}12`,
    halo: `${Colors.primary}24`,
    fg: Colors.primary,
  },
  error: { ring: "#FEE2E2", halo: "#FCA5A5", fg: "#DC2626" },
  search: { ring: "#E0E7FF", halo: "#A5B4FC", fg: "#4F46E5" },
  success: { ring: "#DCFCE7", halo: "#86EFAC", fg: "#16A34A" },
};

const DEFAULT_ICON: Record<EmptyStateVariant, keyof typeof Feather.glyphMap> = {
  empty: "inbox",
  error: "alert-triangle",
  search: "search",
  success: "check-circle",
};

export function EmptyState({
  variant = "empty",
  icon,
  image,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const palette = VARIANTS[variant];
  const iconName = icon ?? DEFAULT_ICON[variant];

  return (
    <View style={[s.container, style]}>
      {/* Illustration — nested rings give a "Figma-style" stacked look */}
      <View style={[s.outerRing, { backgroundColor: palette.ring }]}>
        <View style={[s.innerRing, { backgroundColor: palette.halo }]}>
          {image ? (
            <Image source={image} style={s.illustration} resizeMode="contain" />
          ) : (
            <Feather name={iconName} size={36} color={palette.fg} />
          )}
        </View>
      </View>

      <Text style={[s.title, { color: colors.text }]} numberOfLines={2}>
        {title}
      </Text>

      {description ? (
        <Text style={[s.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}

      {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
        <View style={s.actions}>
          {actionLabel && onAction ? (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onAction();
              }}
              style={[s.primaryBtn, { backgroundColor: palette.fg }]}
            >
              <Text style={s.primaryBtnText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onSecondary();
              }}
              style={s.secondaryBtn}
            >
              <Text style={[s.secondaryBtnText, { color: colors.textSecondary }]}>
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 14,
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  innerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: 72,
    height: 72,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    maxWidth: 300,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  secondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
