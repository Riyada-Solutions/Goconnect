import React from "react";
import { View } from "react-native";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

interface Props {
  intake: string;
  output: string;
  onIntakeChange: (v: string) => void;
  onOutputChange: (v: string) => void;
  colors: any;
}

export function IntakeOutputForm({ intake, output, onIntakeChange, onOutputChange, colors }: Props) {
  return (
    <View style={s.formRow}>
      <FormField label="Intake (ml)" value={intake} onChangeText={onIntakeChange} colors={colors} half keyboardType="numeric" />
      <FormField label="Output (ml)" value={output} onChangeText={onOutputChange} colors={colors} half keyboardType="numeric" />
    </View>
  );
}
