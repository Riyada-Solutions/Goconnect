import React from "react";
import { View } from "react-native";

import { SelectField } from "@/components/ui/SelectField";
import { SignatureField, type SignatureValue } from "@/components/ui/SignatureField";
import { Colors } from "@/theme/colors";
import type { FlowSheetMobilePostTx } from "@/data/models/flowSheet";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

const CONDITION_OPTIONS = ["Stable", "Improved", "Unchanged", "Deteriorated"] as const;

interface Props {
  postTx: FlowSheetMobilePostTx;
  patientSignature: SignatureValue;
  nurseSignature: SignatureValue;
  onChange: (postTx: FlowSheetMobilePostTx) => void;
  onPatientSignatureChange: (v: SignatureValue) => void;
  onNurseSignatureChange: (v: SignatureValue) => void;
  onSignatureSaved?: (kind: "patient" | "nurse", value: SignatureValue) => void;
  colors: any;
  disabled?: boolean;
}

function set<K extends keyof FlowSheetMobilePostTx>(
  postTx: FlowSheetMobilePostTx,
  onChange: (v: FlowSheetMobilePostTx) => void,
  key: K,
  value: FlowSheetMobilePostTx[K],
) {
  onChange({ ...postTx, [key]: value });
}

export function PostTreatmentForm({
  postTx,
  patientSignature,
  nurseSignature,
  onChange,
  onPatientSignatureChange,
  onNurseSignatureChange,
  onSignatureSaved,
  colors,
  disabled,
}: Props) {
  const upd = <K extends keyof FlowSheetMobilePostTx>(key: K) =>
    (value: FlowSheetMobilePostTx[K]) => set(postTx, onChange, key, value);

  return (
    <>
      {/* ── Post Weight / Last BP ─────────────────────────────────── */}
      <View style={s.formRow}>
        <FormField
          label="Post Weight (Kg)"
          value={postTx.postWeight}
          onChangeText={upd("postWeight")}
          colors={colors}
          half
          keyboardType="numeric"
          editable={!disabled}
        />
        <FormField
          label="Last BP (mmHg)"
          value={postTx.lastBp}
          onChangeText={upd("lastBp")}
          colors={colors}
          half
          placeholder="e.g. 120/80"
          editable={!disabled}
        />
      </View>

      {/* ── Last Pulse / Condition ────────────────────────────────── */}
      <View style={s.formRow}>
        <FormField
          label="Last Pulse (bpm)"
          value={postTx.lastPulse}
          onChangeText={upd("lastPulse")}
          colors={colors}
          half
          keyboardType="numeric"
          editable={!disabled}
        />
        <View style={{ flex: 1 }}>
          <SelectField
            label="Condition"
            value={postTx.condition || null}
            options={CONDITION_OPTIONS}
            placeholder="Select..."
            onChange={upd("condition")}
            disabled={disabled}
          />
        </View>
      </View>

      {/* ── Notes ─────────────────────────────────────────────────── */}
      <FormField
        label="Notes"
        value={postTx.notes}
        onChangeText={upd("notes")}
        colors={colors}
        placeholder="e.g. Tolerated well"
        editable={!disabled}
      />

      {/* ── Signatures ───────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <SignatureField
          label={"Patient\nSignature"}
          value={patientSignature}
          onChange={(v) => {
            onPatientSignatureChange(v);
            if (v.signed && v.dataUrl) onSignatureSaved?.("patient", v);
          }}
          accentColor={Colors.primary}
          iconIdle="edit-3"
          subtitle="Post Treatment Acknowledgement"
          statement="I acknowledge that I have received the post-treatment assessment and have been informed of my condition and care instructions."
        />
        <SignatureField
          label={"Nurse\nSignature"}
          value={nurseSignature}
          onChange={(v) => {
            onNurseSignatureChange(v);
            if (v.signed && v.dataUrl) onSignatureSaved?.("nurse", v);
          }}
          accentColor="#8B5CF6"
          iconIdle="pen-tool"
          subtitle="Post Treatment Verification"
          statement="I verify that I have completed the post-treatment assessment, documented all relevant clinical data, and provided appropriate patient education."
        />
      </View>
    </>
  );
}
