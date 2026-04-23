import React from "react";
import { View } from "react-native";

import { SignatureField, type SignatureValue } from "@/components/ui/SignatureField";
import { Colors } from "@/theme/colors";
import type { FlowSheetMobilePostTx } from "@/data/models/flowSheet";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

interface Props {
  postTx: FlowSheetMobilePostTx;
  patientSignature: SignatureValue;
  nurseSignature: SignatureValue;
  onChange: (postTx: FlowSheetMobilePostTx) => void;
  onPatientSignatureChange: (v: SignatureValue) => void;
  onNurseSignatureChange: (v: SignatureValue) => void;
  /** Called after a signature is confirmed so the parent can persist it to the API. */
  onSignatureSaved?: (kind: "patient" | "nurse", value: SignatureValue) => void;
  colors: any;
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
}: Props) {
  return (
    <>
      <View style={s.formRow}>
        <FormField label="Post Weight (Kg)" value={postTx.postWeight} onChangeText={(v) => onChange({ ...postTx, postWeight: v })} colors={colors} half keyboardType="numeric" />
        <FormField label="Condition" value={postTx.condition} onChangeText={(v) => onChange({ ...postTx, condition: v })} colors={colors} half placeholder="e.g. Stable" />
      </View>
      <View style={s.formRow}>
        <FormField label="Last BP (mmHg)" value={postTx.lastBp} onChangeText={(v) => onChange({ ...postTx, lastBp: v })} colors={colors} half />
        <FormField label="Last Pulse (bpm)" value={postTx.lastPulse} onChangeText={(v) => onChange({ ...postTx, lastPulse: v })} colors={colors} half keyboardType="numeric" />
      </View>
      <FormField label="Notes" value={postTx.notes} onChangeText={(v) => onChange({ ...postTx, notes: v })} colors={colors} placeholder="Post treatment notes..." />
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
