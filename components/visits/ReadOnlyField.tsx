import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";

import { visitDetailStyles as s } from "./visit-detail.styles";

interface Props {
  label: string;
  value?: string | null;
  colors: any;
  style?: StyleProp<ViewStyle>;
  numberOfLines?: number;
}

/**
 * Label-above-boxed-value read-only field — the shared look for every
 * server-sourced, non-editable field across visit forms (Visit Info,
 * Enrollments Checklist demographics, Doctor Progress Note vitals, etc).
 * Callers lay these out in a flex-wrap row and size each field's width.
 */
export function ReadOnlyField({ label, value, colors, style, numberOfLines }: Props) {
  return (
    <View style={style}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <View style={[s.formInput, { backgroundColor: colors.borderLight, borderColor: colors.border, justifyContent: "center" }]}>
        <Text style={{ color: colors.text }} numberOfLines={numberOfLines}>
          {value && String(value).trim() !== "" ? value : "—"}
        </Text>
      </View>
    </View>
  );
}
