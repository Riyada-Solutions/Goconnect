import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";

import { BottomSheet } from "@/components/common/BottomSheet";
import { KeyboardAwareScrollViewCompat } from "@/components/common/KeyboardAwareScrollViewCompat";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import {
  drugLabel,
  emptyMedicationRow,
  medicationToRowValues,
  validateMedicationRow,
  type MedicationOptions,
  type MedicationRowValues,
  type MedicationType,
  type PatientMedication,
} from "@/data/models/patientMedication";

import { MedicationRowForm } from "./MedicationRowForm";

interface Props {
  visible: boolean;
  onClose: () => void;
  options: MedicationOptions;
  optionsLoading?: boolean;
  medication: PatientMedication | null;
  type: MedicationType;
  isSaving: boolean;
  /** Flat 422 keys for this single medication. */
  serverErrors: Record<string, string>;
  onSave: (values: MedicationRowValues) => void;
  colors: any;
}

/**
 * Edit one medication — the same fields, flattened, no `type` in the body.
 *
 * Editing never changes the medication's status (§12.2) and always clears
 * the nurse acknowledgement (§12.3), so the sheet says so rather than
 * letting the nurse discover it afterwards.
 */
export function EditMedicationSheet({
  visible,
  onClose,
  options,
  optionsLoading,
  medication,
  type,
  isSaving,
  serverErrors,
  onSave,
  colors,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [values, setValues] = useState<MedicationRowValues>(() => emptyMedicationRow());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setValues(medication ? medicationToRowValues(medication) : emptyMedicationRow());
  }, [visible, medication]);

  useEffect(() => {
    if (Object.keys(serverErrors).length > 0) setErrors(serverErrors);
  }, [serverErrors]);

  const save = () => {
    const found = validateMedicationRow(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(values);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit medication"
      subtitle={medication ? drugLabel(medication.drug) || `#${medication.id}` : undefined}
      maxHeightRatio={0.92}
    >
      {optionsLoading || !medication ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          <KeyboardAwareScrollViewCompat
            style={{ maxHeight: windowHeight * 0.62 }}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <MedicationRowForm
              values={values}
              onChange={setValues}
              options={options}
              type={type}
              errors={errors}
              colors={colors}
              lockDrug
              disabled={isSaving}
            />
            <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>
              Saving clears the nurse acknowledgement and keeps the medication in its current
              section — a stopped medication stays stopped.
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
              onPress={onClose}
            >
              <Text style={[s.mainBtnText, { color: colors.text }]}>Close</Text>
            </Pressable>
            <Pressable
              style={[s.saveFlowBtn, { flex: 1.6, backgroundColor: Colors.primary, opacity: isSaving ? 0.6 : 1 }]}
              onPress={save}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="save" size={15} color="#fff" />
              )}
              <Text style={s.mainBtnText}>{isSaving ? "Saving…" : "Update medication"}</Text>
            </Pressable>
          </View>
        </>
      )}
    </BottomSheet>
  );
}
