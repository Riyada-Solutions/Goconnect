import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function CheckboxField({ label, value, onChange, disabled }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, opacity: disabled ? 0.6 : 1 }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: value ? Colors.primary : colors.border,
          backgroundColor: value ? Colors.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {value && <Feather name="check" size={13} color="#fff" />}
      </View>
      <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.text, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}
