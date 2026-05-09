import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  signed: boolean;
  signedAt?: string;
  signedLabel?: string;
  unsignedLabel?: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ClickToSignButton({
  signed,
  signedAt,
  signedLabel = "Signed",
  unsignedLabel = "Click to Sign",
  onPress,
  disabled,
}: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: signed ? "#22C55E" : Colors.primary,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Feather name={signed ? "check-circle" : "edit-3"} size={14} color="#fff" />
      <View>
        <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
          {signed ? signedLabel : unsignedLabel}
        </Text>
        {signed && signedAt ? (
          <Text style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular", fontSize: 10 }}>
            {new Date(signedAt).toLocaleString()}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
