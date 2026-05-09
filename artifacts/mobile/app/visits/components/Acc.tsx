import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { mobileFlowStyles as ms } from "../visit-detail.styles";

interface Props {
  title: string;
  color: string;
  done: boolean;
  isOpen: boolean;
  onToggle: () => void;
  colors: any;
  isReadOnly?: boolean;
  children: React.ReactNode;
}

export function Acc({ title, color, done, isOpen, onToggle, colors, isReadOnly, children }: Props) {
  return (
    <View style={[ms.borderedSection, { borderLeftColor: color, backgroundColor: colors.card }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={[ms.accHeader, { backgroundColor: `${color}18` }]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          {done && (
            <View style={ms.checkCircle}>
              <Feather name="check" size={12} color="#fff" />
            </View>
          )}
          <Text style={[ms.accHeaderText, { color }]}>{title}</Text>
        </View>
        <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={color} />
      </Pressable>
      {isOpen && (
        <View style={ms.sectionBody} pointerEvents={isReadOnly ? "none" : "auto"}>
          <View>{children}</View>
        </View>
      )}
    </View>
  );
}
