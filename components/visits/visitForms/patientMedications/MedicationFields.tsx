import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { SelectField } from "@/components/ui/SelectField";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import { useDebounce } from "@/hooks/useDebounce";
import { useDrugSearch } from "@/hooks/usePatientMedications";
import { drugLabel, type Drug, type MedicationOptionItem } from "@/data/models/patientMedication";

/** Section divider inside the sheets. */
export function FieldLabel({ label, required, colors }: { label: string; required?: boolean; colors: any }) {
  return (
    <Text style={[s.formLabel, { color: colors.text }]}>
      {label}
      {required ? " *" : ""}
    </Text>
  );
}

interface TextProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
  required?: boolean;
  error?: string;
  editable?: boolean;
}

export function MedTextField({
  label,
  value,
  onChange,
  colors,
  placeholder,
  keyboardType,
  multiline,
  required,
  error,
  editable = true,
}: TextProps) {
  return (
    <View>
      <FieldLabel label={label} required={required} colors={colors} />
      <TextInput
        style={[
          s.formInput,
          {
            color: colors.text,
            backgroundColor: editable ? colors.surface : colors.borderLight,
            borderColor: error ? "#EF4444" : colors.border,
            borderWidth: error ? 1.5 : 1,
            minHeight: multiline ? 70 : undefined,
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
      {error ? <FieldError text={error} /> : null}
    </View>
  );
}

export function FieldError({ text }: { text: string }) {
  return (
    <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#EF4444", marginTop: 3 }}>
      {text}
    </Text>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: MedicationOptionItem[];
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Plain dropdown over an option list. The API wants the **value** (the label
 * text) for `frequency` and `duration`, so that is what every option carries.
 */
export function MedSelectField({
  label,
  value,
  options,
  onChange,
  required,
  error,
  disabled,
  placeholder,
}: SelectProps) {
  return (
    <SelectField
      label={required ? `${label} *` : label}
      value={value || null}
      options={options.map((o) => ({ value: o.value, label: o.value }))}
      placeholder={placeholder ?? "Choose…"}
      onChange={onChange}
      disabled={disabled}
      error={error}
    />
  );
}

const CUSTOM_KEY = "__custom__";

/**
 * A dropdown that also accepts free text — §5 says `frequency` is a plain
 * string field whose list is a convenience, not a constraint. Picking
 * "Custom…" swaps in a text box; a value that isn't in the list opens in
 * that mode already, so an existing medication never loses its wording.
 */
export function MedSelectOrTextField({
  label,
  value,
  options,
  onChange,
  required,
  error,
  disabled,
  colors,
  customLabel = "Custom…",
}: SelectProps & { colors: any; customLabel?: string }) {
  const known = options.some((o) => o.value === value);
  const [custom, setCustom] = useState(!!value && !known);

  if (custom) {
    return (
      <View>
        <MedTextField
          label={label}
          value={value}
          onChange={onChange}
          colors={colors}
          required={required}
          error={error}
          editable={!disabled}
          placeholder="Type the value"
        />
        {!disabled ? (
          <Pressable onPress={() => { setCustom(false); onChange(""); }} style={{ paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary }}>
              Pick from the list instead
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <SelectField
      label={required ? `${label} *` : label}
      value={value || null}
      options={[
        ...options.map((o) => ({ value: o.value, label: o.value })),
        { value: CUSTOM_KEY, label: customLabel },
      ]}
      placeholder="Choose…"
      onChange={(v) => {
        if (v === CUSTOM_KEY) {
          setCustom(true);
          onChange("");
          return;
        }
        onChange(v);
      }}
      disabled={disabled}
      error={error}
    />
  );
}

interface DrugPickerProps {
  value: string;
  drugId: number | null;
  onPick: (drug: Drug) => void;
  onClear: () => void;
  colors: any;
  error?: string;
  /** Edit mode locks the drug — the mockup keeps it read-only there. */
  locked?: boolean;
}

/**
 * Drug autocomplete. Typing at least two characters queries `/drugs?search=`
 * after a 300 ms debounce (§4); picking a hit stores the `drug_id` and
 * collapses the list back to a single read-only line.
 */
export function DrugPicker({ value, drugId, onPick, onClear, colors, error, locked }: DrugPickerProps) {
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 300);
  const query = useDrugSearch(debounced, !locked && !drugId);
  const results = query.data ?? [];

  if (drugId || locked) {
    return (
      <View>
        <FieldLabel label="Drug" required colors={colors} />
        <View
          style={[
            s.formInput,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.borderLight,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="check-circle" size={14} color="#059669" />
          <Text style={{ flex: 1, fontSize: 13.5, fontFamily: "Inter_500Medium", color: colors.text }}>
            {value || "—"}
          </Text>
          {!locked ? (
            <Pressable onPress={() => { setTerm(""); onClear(); }} hitSlop={8}>
              <Feather name="x" size={15} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View>
      <FieldLabel label="Drug" required colors={colors} />
      <View
        style={[
          s.formInput,
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.surface,
            borderColor: error ? "#EF4444" : colors.border,
            borderWidth: error ? 1.5 : 1,
          },
        ]}
      >
        <Feather name="search" size={14} color={colors.textTertiary} />
        <TextInput
          style={{ flex: 1, padding: 0, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.text }}
          value={term}
          onChangeText={setTerm}
          placeholder="Search drug name, code, scientific name"
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
        />
        {query.isFetching ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
      </View>
      {error ? <FieldError text={error} /> : null}

      {debounced.trim().length >= 2 ? (
        <View
          style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {query.isLoading ? (
            <View style={{ padding: 12, alignItems: "center" }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : results.length === 0 ? (
            <Text
              style={{
                padding: 12,
                fontSize: 12.5,
                fontFamily: "Inter_400Regular",
                color: colors.textSecondary,
              }}
            >
              No drugs match “{debounced.trim()}”
            </Text>
          ) : (
            results.slice(0, 8).map((drug, i) => (
              <Pressable
                key={drug.id}
                onPress={() => { setTerm(""); onPick(drug); }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.borderLight,
                }}
              >
                <Text style={{ fontSize: 13.5, fontFamily: "Inter_600SemiBold", color: colors.text }}>
                  {drugLabel(drug)}
                </Text>
                {drug.code ? (
                  <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
                    {drug.code}
                  </Text>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
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
