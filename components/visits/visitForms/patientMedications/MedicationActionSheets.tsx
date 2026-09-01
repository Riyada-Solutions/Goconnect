import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/common/BottomSheet";
import { KeyboardAwareScrollViewCompat } from "@/components/common/KeyboardAwareScrollViewCompat";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import { drugLabel, type MedicationOptions, type PatientMedication } from "@/data/models/patientMedication";

import { MedSelectField, MedTextField } from "./MedicationFields";

interface DoseProps {
  visible: boolean;
  onClose: () => void;
  medication: PatientMedication | null;
  options: MedicationOptions;
  isSaving: boolean;
  onSave: (input: { administeredBy: string; reason?: string }) => void;
  colors: any;
}

interface AcknowledgeProps {
  visible: boolean;
  onClose: () => void;
  medication: PatientMedication | null;
  isSaving: boolean;
  onConfirm: () => void;
  colors: any;
}

/** Record a dose — `POST …/{id}/administer` (§4). */
export function AdministerDoseSheet({
  visible,
  onClose,
  medication,
  options,
  isSaving,
  onSave,
  colors,
}: DoseProps) {
  const [administeredBy, setAdministeredBy] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    // Whoever gave the last dose is the likeliest answer again.
    setAdministeredBy(medication?.administeredBy || options.administeredBy[0]?.value || "");
    setReason("");
    setError("");
  }, [visible, medication, options]);

  const save = () => {
    if (!administeredBy.trim()) {
      setError("Required");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({ administeredBy, reason: reason.trim() || undefined });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Record a dose"
      subtitle={medication ? drugLabel(medication.drug) : undefined}
      maxHeightRatio={0.7}
    >
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <MedSelectField
          label="Administered by"
          value={administeredBy}
          options={options.administeredBy}
          onChange={(v) => { setAdministeredBy(v); setError(""); }}
          required
          error={error}
          disabled={isSaving}
        />
        <MedTextField
          label="Reason"
          value={reason}
          onChange={setReason}
          colors={colors}
          placeholder="Optional — e.g. routine dialysis dose"
          multiline
          editable={!isSaving}
        />
        <Pressable
          style={[s.saveFlowBtn, { backgroundColor: Colors.primary, opacity: isSaving ? 0.6 : 1 }]}
          onPress={save}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="check" size={15} color="#fff" />
          )}
          <Text style={s.mainBtnText}>{isSaving ? "Saving…" : "Save dose"}</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </BottomSheet>
  );
}

interface RefillProps {
  visible: boolean;
  onClose: () => void;
  medication: PatientMedication | null;
  isSaving: boolean;
  onConfirm: (notes?: string) => void;
  colors: any;
}

/**
 * Refill — `POST …/{id}/refill` (§4). A refill restarts the course from
 * today, recalculates the end date, writes a history row and clears the
 * acknowledgement, so the sheet spells that out before confirming.
 */
export function RefillMedicationSheet({
  visible,
  onClose,
  medication,
  isSaving,
  onConfirm,
  colors,
}: RefillProps) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (visible) setNotes("");
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Refill medication"
      subtitle={medication ? drugLabel(medication.drug) : undefined}
      maxHeightRatio={0.7}
    >
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 12.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
          The course restarts today: the end date is recalculated, a history entry is written and the
          nurse acknowledgement is cleared.
        </Text>
        <MedTextField
          label="Notes"
          value={notes}
          onChange={setNotes}
          colors={colors}
          placeholder="Optional"
          multiline
          editable={!isSaving}
        />
        <Pressable
          style={[s.saveFlowBtn, { backgroundColor: Colors.primary, opacity: isSaving ? 0.6 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onConfirm(notes.trim() || undefined);
          }}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="refresh-cw" size={15} color="#fff" />
          )}
          <Text style={s.mainBtnText}>{isSaving ? "Refilling…" : "Confirm refill"}</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </BottomSheet>
  );
}

/** Acknowledge medication — `POST …/{id}/acknowledge`. */
export function AcknowledgeMedicationSheet({
  visible,
  onClose,
  medication,
  isSaving,
  onConfirm,
  colors,
}: AcknowledgeProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Acknowledge medication"
      subtitle={medication ? drugLabel(medication.drug) : undefined}
      maxHeightRatio={0.6}
    >
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 12.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
          Confirm that you have reviewed and acknowledge this medication order.
        </Text>
        <Pressable
          style={[s.saveFlowBtn, { backgroundColor: Colors.primary, opacity: isSaving ? 0.6 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onConfirm();
          }}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="check-circle" size={15} color="#fff" />
          )}
          <Text style={s.mainBtnText}>{isSaving ? "Acknowledging…" : "Acknowledge"}</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </BottomSheet>
  );
}
