import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";

import { BottomSheet } from "@/components/common/BottomSheet";
import { KeyboardAwareScrollViewCompat } from "@/components/common/KeyboardAwareScrollViewCompat";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import {
  emptyMedicationRow,
  rowHasDrug,
  validateMedicationRow,
  type MedicationOptions,
  type MedicationRowValues,
  type MedicationType,
} from "@/data/models/patientMedication";

import { MedicationRowForm } from "./MedicationRowForm";

interface Props {
  visible: boolean;
  onClose: () => void;
  options: MedicationOptions;
  optionsLoading?: boolean;
  type: MedicationType;
  isSaving: boolean;
  /** Row index → field → message, straight from a 422 (§3). */
  serverErrors: Record<number, Record<string, string>>;
  onSave: (rows: MedicationRowValues[]) => void;
  colors: any;
}

/**
 * Add medications — several rows, one atomic `POST` (§4).
 *
 * Add / Remove / Clear are entirely local; nothing leaves the device until
 * Save. A 422 comes back keyed `medications.{index}.{field}`, so each message
 * lands on the row that caused it.
 */
export function AddMedicationsSheet({
  visible,
  onClose,
  options,
  optionsLoading,
  type,
  isSaving,
  serverErrors,
  onSave,
  colors,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [rows, setRows] = useState<MedicationRowValues[]>(() => [emptyMedicationRow()]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  // Fresh rows every time the sheet opens, and whenever the tab changes —
  // the two types don't share their conditional fields.
  useEffect(() => {
    if (!visible) return;
    setRows([emptyMedicationRow()]);
    setErrors({});
  }, [visible, type]);

  // Server-side messages replace whatever the local pass produced.
  useEffect(() => {
    if (Object.keys(serverErrors).length > 0) setErrors(serverErrors);
  }, [serverErrors]);

  const setRow = (index: number, next: MedicationRowValues) =>
    setRows((prev) => prev.map((row, i) => (i === index ? next : row)));

  const addRow = () => {
    Haptics.selectionAsync();
    setRows((prev) => [...prev, emptyMedicationRow()]);
  };

  const removeRow = (index: number) => {
    // The last remaining row can't be removed — §4.
    if (rows.length === 1) return;
    Haptics.selectionAsync();
    setRows((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next: Record<number, Record<string, string>> = {};
      for (const [key, value] of Object.entries(prev)) {
        const i = Number(key);
        if (i === index) continue;
        next[i > index ? i - 1 : i] = value;
      }
      return next;
    });
  };

  const clear = () => {
    Haptics.selectionAsync();
    setRows([emptyMedicationRow()]);
    setErrors({});
  };

  const save = () => {
    const found: Record<number, Record<string, string>> = {};
    rows.forEach((row, i) => {
      const rowErrors = validateMedicationRow(row);
      if (Object.keys(rowErrors).length > 0) found[i] = rowErrors;
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(rows);
  };

  const saveEnabled = rows.some(rowHasDrug) && !isSaving;
  const label = rows.length === 1 ? "Save medication" : `Save ${rows.length} medications`;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add medications"
      subtitle={type === "home_medications" ? "Home medications" : "Dialysis medications"}
      maxHeightRatio={0.92}
    >
      {optionsLoading ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          <KeyboardAwareScrollViewCompat
            style={{ maxHeight: windowHeight * 0.62 }}
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row, index) => (
              <View
                key={index}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  padding: 12,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ flex: 1, fontSize: 12.5, fontFamily: "Inter_700Bold", color: colors.textSecondary }}>
                    MEDICATION {index + 1}
                  </Text>
                  {rows.length > 1 ? (
                    <Pressable onPress={() => removeRow(index)} hitSlop={8}>
                      <Feather name="x" size={16} color={colors.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>

                <MedicationRowForm
                  values={row}
                  onChange={(next) => setRow(index, next)}
                  options={options}
                  type={type}
                  errors={errors[index] ?? {}}
                  colors={colors}
                  disabled={isSaving}
                />
              </View>
            ))}

            <Pressable
              onPress={addRow}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.border,
              }}
            >
              <Feather name="plus" size={15} color={Colors.primary} />
              <Text style={{ fontSize: 13.5, fontFamily: "Inter_600SemiBold", color: Colors.primary }}>
                Add another medication
              </Text>
            </Pressable>

            <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>
              All rows are saved in one request. If one row fails validation, nothing is saved.
            </Text>
          </KeyboardAwareScrollViewCompat>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
            }}
          >
            <Pressable
              style={[s.saveFlowBtn, { flex: 1, backgroundColor: colors.borderLight }]}
              onPress={clear}
              disabled={isSaving}
            >
              <Text style={[s.mainBtnText, { color: colors.text }]}>Clear</Text>
            </Pressable>
            <Pressable
              style={[
                s.saveFlowBtn,
                { flex: 2, backgroundColor: Colors.primary, opacity: saveEnabled ? 1 : 0.5 },
              ]}
              onPress={save}
              disabled={!saveEnabled}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="save" size={15} color="#fff" />
              )}
              <Text style={s.mainBtnText}>{isSaving ? "Saving…" : label}</Text>
            </Pressable>
          </View>
        </>
      )}
    </BottomSheet>
  );
}
