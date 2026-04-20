import React from "react";
import { Text, View } from "react-native";

import type { FlowSheetMobileVitals } from "@/types/flowSheet";
import { mobileFlowStyles as ms, visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

interface Props {
  vitals: FlowSheetMobileVitals;
  bpSite: string;
  method: string;
  onVitalChange: (key: keyof FlowSheetMobileVitals, v: string) => void;
  onBpSiteChange: (v: string) => void;
  onMethodChange: (v: string) => void;
  colors: any;
}

export function VitalsForm({ vitals, bpSite, method, onVitalChange, onBpSiteChange, onMethodChange, colors }: Props) {
  return (
    <>
      <View style={s.formRow}>
        <FormField label="Height (Cm)" value={vitals.height} onChangeText={(v) => onVitalChange("height", v)} colors={colors} half keyboardType="numeric" />
        <FormField label="Pre Weight (Kg)" value={vitals.preWeight} onChangeText={(v) => onVitalChange("preWeight", v)} colors={colors} half keyboardType="numeric" />
      </View>
      <View style={s.formRow}>
        <FormField label="Dry Weight (Kg)" value={vitals.dryWeight} onChangeText={(v) => onVitalChange("dryWeight", v)} colors={colors} half keyboardType="numeric" />
        <FormField label="UF Goal (Kg)" value={vitals.ufGoal} onChangeText={(v) => onVitalChange("ufGoal", v)} colors={colors} half keyboardType="decimal-pad" />
      </View>
      <Text style={[ms.subLabel, { color: colors.text }]}>BP (mmHg)</Text>
      <View style={s.formRow}>
        <FormField label="Systolic" value={vitals.bpSystolic} onChangeText={(v) => onVitalChange("bpSystolic", v)} colors={colors} half keyboardType="numeric" />
        <FormField label="Diastolic" value={vitals.bpDiastolic} onChangeText={(v) => onVitalChange("bpDiastolic", v)} colors={colors} half keyboardType="numeric" />
      </View>
      <FormField label="Site" value={bpSite} onChangeText={onBpSiteChange} colors={colors} placeholder="e.g. Left Arm" />
      <View style={s.formRow}>
        <FormField label="Temperature (°C)" value={vitals.temperature} onChangeText={(v) => onVitalChange("temperature", v)} colors={colors} half keyboardType="decimal-pad" />
        <FormField label="Method" value={method} onChangeText={onMethodChange} colors={colors} half placeholder="e.g. Oral" />
      </View>
      <View style={s.formRow}>
        <FormField label="SpO2 (%)" value={vitals.spo2} onChangeText={(v) => onVitalChange("spo2", v)} colors={colors} half keyboardType="numeric" />
        <FormField label="RBS (mg/dl)" value={vitals.rbs} onChangeText={(v) => onVitalChange("rbs", v)} colors={colors} half keyboardType="numeric" />
      </View>
      <View style={s.formRow}>
        <FormField label="HR (Bpm)" value={vitals.hr} onChangeText={(v) => onVitalChange("hr", v)} colors={colors} half keyboardType="numeric" />
        <FormField label="RR (cpm)" value={vitals.rr} onChangeText={(v) => onVitalChange("rr", v)} colors={colors} half keyboardType="numeric" />
      </View>
    </>
  );
}
