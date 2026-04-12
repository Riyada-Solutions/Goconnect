import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Linking, Platform, Pressable, StyleSheet } from "react-native";

import { Colors } from "@/theme/colors";

type ActionButtonProps = {
  type: "call" | "location";
  value: string;
};

export function ActionButton({ type, value }: ActionButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === "call") {
      const url = `tel:${value.replace(/\s/g, "")}`;
      Linking.canOpenURL(url).then((ok) => (ok ? Linking.openURL(url) : null));
    } else {
      const query = encodeURIComponent(value);
      const url = Platform.select({
        ios: `maps:?q=${query}`,
        android: `geo:0,0?q=${query}`,
        default: `https://maps.google.com/?q=${query}`,
      });
      Linking.openURL(url!);
    }
  };

  return (
    <Pressable onPress={handlePress} style={s.btn}>
      <Feather
        name={type === "call" ? "phone" : "map-pin"}
        size={18}
        color={Colors.primary}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E6F7F9",
    alignItems: "center",
    justifyContent: "center",
  },
});
