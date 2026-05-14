import React from "react";
import { View } from "react-native";

import { SelectField } from "@/components/ui/SelectField";
import { SignatureField, type SignatureValue } from "@/components/ui/SignatureField";
import { Colors } from "@/theme/colors";
import type { FlowSheetMobilePostTx } from "@/data/models/flowSheet";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

const METHOD_OPTIONS = ["Oral", "Axilla", "Tympanic", "Temporal"] as const;
const BP_SITE_OPTIONS = [
  "Right Upper Arm", "Left Upper Arm", "Right Forearm", "Left Forearm",
  "Right Wrist", "Left Wrist", "Right Thigh", "Left Thigh", "Right Ankle", "Left Ankle",
] as const;
const MACHINE_DISINFECTED_OPTIONS = ["yes", "no"] as const;

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

function upd<K extends keyof FlowSheetMobilePostTx>(
  postTx: FlowSheetMobilePostTx,
  onChange: (v: FlowSheetMobilePostTx) => void,
  key: K,
  value: FlowSheetMobilePostTx[K],
) {
  onChange({ ...postTx, [key]: value });
}

export function PostTreatmentForm({
  postTx, patientSignature, nurseSignature,
  onChange, onPatientSignatureChange, onNurseSignatureChange,
  onSignatureSaved, colors, disabled,
}: Props) {
  const set = <K extends keyof FlowSheetMobilePostTx>(key: K) =>
    (value: FlowSheetMobilePostTx[K]) => upd(postTx, onChange, key, value);

  return (
    <>
      {/* ── Post BP ───────────────────────────────────────────────── */}
      <View style={s.formRow}>
        <FormField label="Systolic" value={postTx.bpSystolic} onChangeText={set("bpSystolic")} colors={colors} half keyboardType="numeric" editable={!disabled} />
        <FormField label="Diastolic" value={postTx.bpDiastolic} onChangeText={set("bpDiastolic")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>
      <View style={{ marginBottom: 8 }}>
        <SelectField label="BP Site" value={postTx.bpSite || null} options={BP_SITE_OPTIONS} placeholder="Choose site..." onChange={set("bpSite")} disabled={disabled} />
      </View>

      {/* ── Post Vitals ───────────────────────────────────────────── */}
      <View style={s.formRow}>
        <FormField label="Pulse (bpm)" value={postTx.pulse} onChangeText={set("pulse")} colors={colors} half keyboardType="numeric" editable={!disabled} />
        <FormField label="Temperature (°C)" value={postTx.temp} onChangeText={set("temp")} colors={colors} half keyboardType="decimal-pad" editable={!disabled} />
      </View>
      <View style={s.formRow}>
        <View style={{ flex: 1 }}>
          <SelectField label="Temp Method" value={postTx.tempMethod || null} options={METHOD_OPTIONS} placeholder="Choose..." onChange={set("tempMethod")} disabled={disabled} />
        </View>
        <FormField label="SpO2 (%)" value={postTx.spo2} onChangeText={set("spo2")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>
      <View style={s.formRow}>
        <FormField label="RR (cpm)" value={postTx.rr} onChangeText={set("rr")} colors={colors} half keyboardType="numeric" editable={!disabled} />
        <FormField label="RBS (mg/dl)" value={postTx.rbs} onChangeText={set("rbs")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>
      <FormField label="Post Weight (Kg)" value={postTx.weight} onChangeText={set("weight")} colors={colors} keyboardType="decimal-pad" editable={!disabled} />

      {/* ── Treatment Summary ─────────────────────────────────────── */}
      <View style={s.formRow}>
        <FormField label="Tx Time Hr" value={postTx.txTimeHr} onChangeText={set("txTimeHr")} colors={colors} half keyboardType="numeric" editable={!disabled} />
        <FormField label="Tx Time Min" value={postTx.txTimeMin} onChangeText={set("txTimeMin")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>
      <View style={s.formRow}>
        <FormField label="Tx Time (L)" value={postTx.txTimeL} onChangeText={set("txTimeL")} colors={colors} half keyboardType="decimal-pad" editable={!disabled} />
        <FormField label="Dialysate (L)" value={postTx.dialysateL} onChangeText={set("dialysateL")} colors={colors} half keyboardType="decimal-pad" editable={!disabled} />
      </View>
      <View style={s.formRow}>
        <FormField label="UF" value={postTx.uf} onChangeText={set("uf")} colors={colors} half keyboardType="decimal-pad" editable={!disabled} />
        <FormField label="BLP" value={postTx.blp} onChangeText={set("blp")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>

      {/* ── Access & Machine ──────────────────────────────────────── */}
      <View style={s.formRow}>
        <FormField label="Catheter Lock" value={postTx.catheterLock} onChangeText={set("catheterLock")} colors={colors} half editable={!disabled} />
        <FormField label="Arterial Access" value={postTx.arterialAccess} onChangeText={set("arterialAccess")} colors={colors} half editable={!disabled} />
      </View>
      <View style={s.formRow}>
        <FormField label="Venous Access" value={postTx.venousAccess} onChangeText={set("venousAccess")} colors={colors} half editable={!disabled} />
        <FormField label="Needle Sites Held" value={postTx.needleSitesHeld} onChangeText={set("needleSitesHeld")} colors={colors} half editable={!disabled} />
      </View>
      <FormField label="Access Problems" value={postTx.accessProblems} onChangeText={set("accessProblems")} colors={colors} editable={!disabled} />
      <View style={{ marginBottom: 8 }}>
        <SelectField label="Machine Disinfected" value={postTx.machineDisinfected || null} options={MACHINE_DISINFECTED_OPTIONS} placeholder="Select..." onChange={set("machineDisinfected")} disabled={disabled} />
      </View>

      {/* ── Incidents ─────────────────────────────────────────────── */}
      <FormField label="Medical Complaints" value={postTx.medicalComplaints} onChangeText={set("medicalComplaints")} colors={colors} editable={!disabled} />
      <FormField label="Non-Medical Incidence" value={postTx.nonMedicalIncidence} onChangeText={set("nonMedicalIncidence")} colors={colors} editable={!disabled} />
      <FormField label="Initials" value={postTx.initials} onChangeText={set("initials")} colors={colors} editable={!disabled} />

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
