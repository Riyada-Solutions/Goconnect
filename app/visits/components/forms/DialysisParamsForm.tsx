import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { SelectField } from "@/components/ui/SelectField";
import type { FlowSheetDialysisParam } from "@/data/models/flowSheet";
import { mobileFlowStyles as ms, visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

const BP_SITE_OPTIONS = [
  "Right Upper Arm",
  "Left Upper Arm",
  "Right Forearm",
  "Left Forearm",
  "Right Wrist",
  "Left Wrist",
  "Right Thigh",
  "Left Thigh",
  "Right Ankle",
  "Left Ankle",
] as const;

interface Props {
  rows: FlowSheetDialysisParam[];
  onChange: (rows: FlowSheetDialysisParam[]) => void;
  colors: any;
}

const EMPTY_ROW: FlowSheetDialysisParam = {
  time: "", systolic: "", diastolic: "", site: "", bpSite: "", pulse: "", dialysateRate: "",
  uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "",
  access: "", alarms: "", initials: "",
};

export function DialysisParamsForm({ rows, onChange, colors }: Props) {
  const updateRow = (idx: number, patch: Partial<FlowSheetDialysisParam>) => {
    const next = [...rows];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <>
      {rows.map((row, idx) => (
        <View
          key={idx}
          style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface, position: "relative" }]}
        >
          <View style={s.formField}>
            <Text style={[s.formLabel, { color: colors.text }]}>Time</Text>
            <DateTimeField
              mode="time"
              value={row.time}
              onChange={(v) => updateRow(idx, { time: v })}
              colors={colors}
            />
          </View>
          <Text style={[ms.subLabel, { color: colors.text }]}>Blood Pressure (mmHg)</Text>
          <View style={s.formRow}>
            <FormField label="Systolic" value={row.systolic} onChangeText={(v) => updateRow(idx, { systolic: v })} colors={colors} half keyboardType="numeric" />
            <FormField label="Diastolic" value={row.diastolic} onChangeText={(v) => updateRow(idx, { diastolic: v })} colors={colors} half keyboardType="numeric" />
          </View>
          <View style={s.formRow}>
            <View style={{ flex: 1 }}>
              <SelectField
                label="Site"
                value={row.bpSite || null}
                options={BP_SITE_OPTIONS}
                placeholder="Choose"
                onChange={(v) => updateRow(idx, { bpSite: v, site: v })}
              />
            </View>
            <FormField label="Pulse (bpm)" value={row.pulse} onChangeText={(v) => updateRow(idx, { pulse: v })} colors={colors} half keyboardType="numeric" />
          </View>
          <Text style={[ms.subLabel, { color: colors.text }]}>Rates</Text>
          <View style={s.formRow}>
            <FormField label="Dialysate (L/hr)" value={row.dialysateRate} onChangeText={(v) => updateRow(idx, { dialysateRate: v })} colors={colors} half keyboardType="decimal-pad" />
            <FormField label="UF (L/hr)" value={row.uf} onChangeText={(v) => updateRow(idx, { uf: v })} colors={colors} half keyboardType="decimal-pad" />
          </View>
          <FormField label="BFR (ml/min)" value={row.bfr} onChangeText={(v) => updateRow(idx, { bfr: v })} colors={colors} keyboardType="numeric" />
          <Text style={[ms.subLabel, { color: colors.text }]}>Volumes</Text>
          <View style={s.formRow}>
            <FormField label="Dialysate (L/hr)" value={row.dialysateVol} onChangeText={(v) => updateRow(idx, { dialysateVol: v })} colors={colors} half keyboardType="decimal-pad" />
            <FormField label="UF (L/hr)" value={row.ufVol} onChangeText={(v) => updateRow(idx, { ufVol: v })} colors={colors} half keyboardType="decimal-pad" />
          </View>
          <Text style={[ms.subLabel, { color: colors.text }]}>Pressures</Text>
          <View style={s.formRow}>
            <FormField label="Venous" value={row.venous} onChangeText={(v) => updateRow(idx, { venous: v })} colors={colors} half keyboardType="numeric" />
            <FormField label="Effluent" value={row.effluent} onChangeText={(v) => updateRow(idx, { effluent: v })} colors={colors} half keyboardType="numeric" />
          </View>
          <FormField label="Access" value={row.access} onChangeText={(v) => updateRow(idx, { access: v })} colors={colors} keyboardType="numeric" />
          <View style={s.formRow}>
            <FormField label="Alarms / Comments" value={row.alarms} onChangeText={(v) => updateRow(idx, { alarms: v })} colors={colors} half />
            <FormField label="Initials" value={row.initials} onChangeText={(v) => updateRow(idx, { initials: v })} colors={colors} half />
          </View>
          {rows.length > 1 && (
            <Pressable onPress={() => onChange(rows.filter((_, i) => i !== idx))} style={s.removeRowBtn}>
              <Feather name="x" size={14} color="#fff" />
            </Pressable>
          )}
        </View>
      ))}
      <Pressable style={[s.addRowBtn, { backgroundColor: Colors.primary }]} onPress={() => onChange([...rows, { ...EMPTY_ROW }])}>
        <Feather name="plus" size={14} color="#fff" />
        <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add Row</Text>
      </Pressable>
    </>
  );
}
