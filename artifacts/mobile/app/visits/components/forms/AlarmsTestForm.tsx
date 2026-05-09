import React from "react";
import { Switch, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { mobileFlowStyles as ms } from "../../visit-detail.styles";

interface Props {
  passed: boolean;
  onChange: (v: boolean) => void;
  colors: any;
}

export function AlarmsTestForm({ passed, onChange, colors }: Props) {
  return (
    <>
      <View style={[ms.subHeaderBar, { backgroundColor: "#F9731618", borderRadius: 6 }]}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#9A3412" }}>Alarms Test Passed</Text>
      </View>
      <View style={ms.switchRow}>
        <Text style={[ms.switchLabel, { color: colors.text }]}>Passed?</Text>
        <Switch
          value={passed}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: `${Colors.primary}60` }}
          thumbColor={passed ? Colors.primary : "#f4f3f4"}
        />
      </View>
    </>
  );
}
