import React from "react";
import { Text, TextInput, View } from "react-native";

import { visitDetailStyles as s } from "../visit-detail.styles";

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  colors: any;
  half?: boolean;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  editable?: boolean;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  half,
  keyboardType,
  editable = true,
}: Props) {
  return (
    <View style={[s.formField, half && { flex: 1 }]}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          s.formInput,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ""}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType ?? "default"}
        editable={editable}
      />
    </View>
  );
}
