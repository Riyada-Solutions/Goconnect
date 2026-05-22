import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { mobileFlowStyles as ms } from "../../visit-detail.styles";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/**
 * Vascular-access options. `value` is what the backend stores in
 * `alarms_test.vascular`; `label` is the short text the nurse sees.
 */
export const ACCESS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "av_fistula",    label: "AVF" },
  { value: "av_graft",      label: "AVG" },
  { value: "cvc_temporary", label: "CATHETER" },
  { value: "permacath",     label: "Permacath" },
];

export function AccessForm({ value, onChange }: Props) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
      {ACCESS_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[ms.radioBtn, selected && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
          >
            <Text style={[ms.radioBtnText, selected && { color: "#fff" }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
