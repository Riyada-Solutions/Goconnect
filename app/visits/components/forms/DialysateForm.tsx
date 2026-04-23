import React from "react";
import { Text, View } from "react-native";

import type { FlowSheetDialysate } from "@/data/models/flowSheet";
import { mobileFlowStyles as ms, visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

interface Props {
  dialysate: FlowSheetDialysate;
  onChange: (dialysate: FlowSheetDialysate) => void;
  colors: any;
}

export function DialysateForm({ dialysate, onChange, colors }: Props) {
  return (
    <>
      <Text style={[ms.subLabel, { color: colors.text }]}>Acetate / Bicarbonate</Text>
      <View style={s.formRow}>
        <FormField label="Na" value={dialysate.na} onChangeText={(v) => onChange({ ...dialysate, na: v })} colors={colors} half keyboardType="numeric" />
        <FormField label="HCO₃" value={dialysate.hco3} onChangeText={(v) => onChange({ ...dialysate, hco3: v })} colors={colors} half keyboardType="numeric" />
      </View>
      <View style={s.formRow}>
        <FormField label="K" value={dialysate.k} onChangeText={(v) => onChange({ ...dialysate, k: v })} colors={colors} half keyboardType="numeric" />
        <FormField label="Glucose" value={dialysate.glucose} onChangeText={(v) => onChange({ ...dialysate, glucose: v })} colors={colors} half />
      </View>
    </>
  );
}
