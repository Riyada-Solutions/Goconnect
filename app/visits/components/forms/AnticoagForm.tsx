import React from "react";
import { View } from "react-native";

import { SelectField } from "@/components/ui/SelectField";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

export const ANTICOAG_OPTIONS = [
  "Heparin",
  "Low Molecular Weight Heparin",
  "Citrate",
  "Nafamostat",
  "Argatroban",
  "None",
] as const;

export interface AnticoagFormValue {
  type: string;
  bolusValue: string;
  hourlyValue: string;
  dialyzerType: string;
  dialyzerSurfaceArea: string;
}

interface Props {
  value: AnticoagFormValue;
  onChange: (v: AnticoagFormValue) => void;
  colors: any;
  disabled?: boolean;
}

export function AnticoagForm({ value, onChange, colors, disabled }: Props) {
  const set = <K extends keyof AnticoagFormValue>(key: K, v: AnticoagFormValue[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <>
      <SelectField
        label="Anticoagulation Type"
        value={value.type || null}
        options={ANTICOAG_OPTIONS}
        placeholder="Select type..."
        onChange={(v) => set("type", v)}
        disabled={disabled}
      />

      <View style={s.formRow}>
        <FormField
          label="Bolus (IU)"
          value={value.bolusValue}
          onChangeText={(v) => set("bolusValue", v)}
          colors={colors}
          half
          keyboardType="numeric"
          editable={!disabled}
        />
        <FormField
          label="Hourly Maintenance (IU)"
          value={value.hourlyValue}
          onChangeText={(v) => set("hourlyValue", v)}
          colors={colors}
          half
          keyboardType="numeric"
          editable={!disabled}
        />
      </View>

      <View style={s.formRow}>
        <FormField
          label="Dialyzer Type"
          value={value.dialyzerType}
          onChangeText={(v) => set("dialyzerType", v)}
          colors={colors}
          half
          editable={!disabled}
        />
        <FormField
          label="Dialyzer Surface Area"
          value={value.dialyzerSurfaceArea}
          onChangeText={(v) => set("dialyzerSurfaceArea", v)}
          colors={colors}
          half
          keyboardType="decimal-pad"
          editable={!disabled}
        />
      </View>
    </>
  );
}
