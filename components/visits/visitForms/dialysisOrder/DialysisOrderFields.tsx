import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, View } from "react-native";

import { SelectField } from "@/components/ui/SelectField";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { toOptionList, type DialysisOptionItem } from "@/data/models/dialysisOrder";

/** Section divider — the uppercase rules in the mockup ("Vascular access"…). */
export function SectionLabel({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, marginBottom: 2 }}>
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Inter_700Bold",
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: colors.textSecondary,
        }}
      >
        {title}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
    </View>
  );
}

/** Inline hint under a field (distal warning, blood-flow cap, cartridge lock). */
export function NoteBox({ text, colors }: { text: string; colors: any }) {
  void colors;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        backgroundColor: "#F59E0B1A",
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 6,
        marginTop: 5,
      }}
    >
      <Feather name="alert-triangle" size={12} color="#B45309" style={{ marginTop: 2 }} />
      <Text style={{ flex: 1, fontSize: 11.5, fontFamily: "Inter_500Medium", color: "#B45309" }}>
        {text}
      </Text>
    </View>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: DialysisOptionItem[];
  /** Option keys the rules currently forbid — filtered out of the list. */
  disabledKeys?: string[];
  required?: boolean;
  error?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}

/**
 * Dropdown fed straight from the API's option list.
 *
 * Restricted options (rules 6 and 23) are removed rather than greyed out —
 * a phone picker has no room for a disabled row, and the accompanying
 * `NoteBox` explains why the choice is gone.
 */
export function DynSelect({
  label,
  value,
  options,
  disabledKeys,
  required,
  error,
  disabled,
  onChange,
}: SelectProps) {
  // Defensive: a stale cached payload can still hand us a non-array list.
  const list = toOptionList(options);
  const allowed = disabledKeys?.length
    ? list.filter((o) => !disabledKeys.includes(o.key))
    : list;
  return (
    <SelectField
      label={required ? `${label} *` : label}
      value={value || null}
      options={allowed.map((o) => ({ value: o.key, label: o.value }))}
      placeholder="Choose…"
      onChange={onChange}
      disabled={disabled}
      error={error}
    />
  );
}

interface TextProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  placeholder?: string;
  /** Rendered to the right of the box — "IU/ml", "%", "/ week". */
  unit?: string | null;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
  required?: boolean;
  error?: string;
  editable?: boolean;
}

export function DynText({
  label,
  value,
  onChange,
  colors,
  placeholder,
  unit,
  keyboardType,
  multiline,
  required,
  error,
  editable = true,
}: TextProps) {
  return (
    <View>
      <Text style={[s.formLabel, { color: colors.text }]}>
        {label}
        {required ? " *" : ""}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          style={[
            s.formInput,
            {
              flex: 1,
              color: colors.text,
              backgroundColor: editable ? colors.surface : colors.borderLight,
              borderColor: error ? "#EF4444" : colors.border,
              borderWidth: error ? 1.5 : 1,
              minHeight: multiline ? 76 : undefined,
              textAlignVertical: multiline ? "top" : "center",
            },
          ]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? ""}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType ?? "default"}
          multiline={multiline}
          editable={editable}
        />
        {unit ? (
          <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.textSecondary, minWidth: 40 }}>
            {unit}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#EF4444", marginTop: 3 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Two fields side by side — the mockup's `.two` grid. */
export function FieldPair({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  if (items.length === 1) return <>{items[0]}</>;
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {items.map((child, i) => (
        <View key={i} style={{ flex: 1 }}>
          {child}
        </View>
      ))}
    </View>
  );
}
