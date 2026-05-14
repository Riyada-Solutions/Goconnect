import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { Colors } from "@/theme/colors";

export type CustomButtonVariant = "filled" | "outlined" | "tonal" | "ghost";

interface CustomButtonProps {
  onPress: () => void;
  title?: string;
  /** Optional override — when provided replaces the title text. */
  children?: React.ReactNode;
  /** Background color for filled variant, border + text color for outlined. */
  color?: string;
  textColor?: string;
  borderColor?: string;
  width?: number | "auto" | "100%";
  height?: number;
  fontSize?: number;
  radius?: number;
  /** Render a circular button (height drives diameter, width ignored). */
  isCircle?: boolean;
  variant?: CustomButtonVariant;
  loading?: boolean;
  enable?: boolean;
  /** Adds extra horizontal padding. */
  widerPadding?: boolean;
  /** Optional Feather icon to the left of the title. */
  icon?: React.ComponentProps<typeof Feather>["name"];
  iconSize?: number;
  /** Skip Haptics.selectionAsync() on press (defaults to enabled). */
  noHaptic?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const DEFAULT_RADIUS = 12;

export function CustomButton({
  onPress,
  title,
  children,
  color,
  textColor,
  borderColor,
  width,
  height = 52,
  fontSize = 16,
  radius = DEFAULT_RADIUS,
  isCircle = false,
  variant = "filled",
  loading = false,
  enable = true,
  widerPadding = false,
  icon,
  iconSize,
  noHaptic = false,
  style,
  textStyle,
  testID,
}: CustomButtonProps) {
  const disabled = !enable || loading;

  const bg =
    variant === "filled"   ? (color ?? Colors.primary)
  : variant === "tonal"    ? `${color ?? Colors.primary}1F`
  :                          "transparent";

  const fg =
    textColor
    ?? (variant === "filled" ? "#fff"
      : (color ?? Colors.primary));

  const bd =
    variant === "outlined"
      ? (borderColor ?? color ?? Colors.primary)
      : (borderColor ?? "transparent");

  const w: ViewStyle["width"] =
    isCircle ? height
    : width === undefined ? "100%"
    : width;

  const r = isCircle ? height / 2 : radius;

  const handlePress = (_e: GestureResponderEvent) => {
    if (disabled) return;
    if (!noHaptic) Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: w,
          height,
          borderRadius: r,
          backgroundColor: bg,
          borderColor: bd,
          borderWidth: variant === "outlined" ? 1.5 : 0,
          paddingHorizontal: isCircle ? 0 : (widerPadding ? 20 : 12),
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : children ? (
        children
      ) : (
        <View style={styles.content}>
          {icon && (
            <Feather name={icon} size={iconSize ?? fontSize + 4} color={fg} />
          )}
          {title && (
            <Text
              numberOfLines={1}
              style={[
                styles.text,
                { color: fg, fontSize },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontFamily: "Inter_700Bold",
  },
});
