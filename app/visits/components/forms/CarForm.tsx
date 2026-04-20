import React from "react";
import { View } from "react-native";

import type { FlowSheetCar } from "@/types/flowSheet";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

interface Props {
  car: FlowSheetCar;
  onChange: (car: FlowSheetCar) => void;
  colors: any;
}

export function CarForm({ car, onChange, colors }: Props) {
  return (
    <>
      <View style={s.formRow}>
        <FormField label="FF %" value={car.ffPercent} onChangeText={(v) => onChange({ ...car, ffPercent: v })} colors={colors} half keyboardType="numeric" />
        <FormField label="Dialyzer" value={car.dialyzer} onChangeText={(v) => onChange({ ...car, dialyzer: v })} colors={colors} half />
      </View>
      <FormField label="Temp" value={car.temp} onChangeText={(v) => onChange({ ...car, temp: v })} colors={colors} keyboardType="decimal-pad" />
    </>
  );
}
