import React from "react";
import { Switch, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { mobileFlowStyles as ms } from "../../visit-detail.styles";

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  colors: any;
}

export function OutsideDialysisForm({ value, onChange, colors }: Props) {
  return (
    <View style={ms.switchRow}>
      <Text style={[ms.switchLabel, { color: colors.text }]}>Did You Have Outside Dialysis?</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: `${Colors.primary}60` }}
        thumbColor={value ? Colors.primary : "#f4f3f4"}
      />
    </View>
  );
}
