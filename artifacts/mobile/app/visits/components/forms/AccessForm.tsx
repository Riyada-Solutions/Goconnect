import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { mobileFlowStyles as ms } from "../../visit-detail.styles";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const OPTIONS = ["AVF", "AVG", "CATHETER", "Permacath"];

export function AccessForm({ value, onChange }: Props) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
      {OPTIONS.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onChange(opt)}
          style={[ms.radioBtn, value === opt && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
        >
          <Text style={[ms.radioBtnText, value === opt && { color: "#fff" }]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}
