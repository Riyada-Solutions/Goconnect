import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import type { FlowSheetNursingAction } from "@/types/flowSheet";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

interface Props {
  rows: FlowSheetNursingAction[];
  onChange: (rows: FlowSheetNursingAction[]) => void;
  colors: any;
}

const EMPTY_ROW: FlowSheetNursingAction = { time: "", focus: "", action: "", evaluation: "", name: "" };

export function NursingActionForm({ rows, onChange, colors }: Props) {
  const updateRow = (idx: number, patch: Partial<FlowSheetNursingAction>) => {
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
          <FormField label="Time" value={row.time} onChangeText={(v) => updateRow(idx, { time: v })} colors={colors} placeholder="--:--" />
          <FormField label="Focus" value={row.focus} onChangeText={(v) => updateRow(idx, { focus: v })} colors={colors} />
          <FormField label="Nursing Action" value={row.action} onChangeText={(v) => updateRow(idx, { action: v })} colors={colors} />
          <FormField label="Evaluation" value={row.evaluation} onChangeText={(v) => updateRow(idx, { evaluation: v })} colors={colors} />
          <FormField label="Name" value={row.name} onChangeText={(v) => updateRow(idx, { name: v })} colors={colors} />
          {rows.length > 1 && (
            <Pressable onPress={() => onChange(rows.filter((_, i) => i !== idx))} style={s.removeRowBtn}>
              <Feather name="x" size={14} color="#fff" />
            </Pressable>
          )}
        </View>
      ))}
      <Pressable style={[s.addRowBtn, { backgroundColor: Colors.primary }]} onPress={() => onChange([...rows, { ...EMPTY_ROW }])}>
        <Feather name="plus" size={14} color="#fff" />
        <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add Action</Text>
      </Pressable>
    </>
  );
}
