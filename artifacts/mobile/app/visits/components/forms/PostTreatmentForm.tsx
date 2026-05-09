import React from "react";
import { Pressable, Text, View } from "react-native";

import { SelectField } from "@/components/ui/SelectField";
import { SignatureField, type SignatureValue } from "@/components/ui/SignatureField";
import { Colors } from "@/theme/colors";
import type { FlowSheetMobilePostTx } from "@/data/models/flowSheet";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

const TEMP_METHOD_OPTIONS = ["Oral", "Axillary", "Tympanic", "Temporal", "Rectal"] as const;

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
      {/* ── BP Sitting ────────────────────────────────────────────── */}
      <View style={s.formRow}>
        <FormField
          label="BP Systolic (mmHg)"
          value={postTx.bpSystolic}
          onChangeText={upd("bpSystolic")}
          colors={colors}
          half
          keyboardType="numeric"
          editable={!disabled}
        />
        <FormField
          label="BP Diastolic (mmHg)"
          value={postTx.bpDiastolic}
          onChangeText={upd("bpDiastolic")}
          colors={colors}
          half
          keyboardType="numeric"
          editable={!disabled}
        />
      </View>
      <View style={s.formRow}>
        <FormField
          label="BP Site"
          value={postTx.bpSite}
          onChangeText={upd("bpSite")}
          colors={colors}
          half
          placeholder="e.g. Right Forearm"
          editable={!disabled}
        />
        <FormField
          label="Pulse (bpm)"
          value={postTx.pulse}
          onChangeText={upd("pulse")}
          colors={colors}
          half
          keyboardType="numeric"
          editable={!disabled}
        />
      </View>

      {/* ── Temp / SpO2 / RR / RBS ───────────────────────────────── */}
      <View style={s.formRow}>
        <FormField
          label="Temp (°C)"
          value={postTx.temp}
          onChangeText={upd("temp")}
          colors={colors}
          half
          keyboardType="numeric"
          editable={!disabled}
        />
        <View style={{ flex: 1 }}>
          <SelectField
            label="Method"
            value={postTx.tempMethod || null}
            options={TEMP_METHOD_OPTIONS}
            placeholder="Select..."
            onChange={upd("tempMethod")}
            disabled={disabled}
          />
        </View>
      </View>
      <View style={s.formRow}>
        <FormField label="SpO2 (%)" value={postTx.spo2} onChangeText={upd("spo2")} colors={colors} half keyboardType="numeric" editable={!disabled} />
        <FormField label="RR (cpm)" value={postTx.rr} onChangeText={upd("rr")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>
      <View style={s.formRow}>
        <FormField label="RBS (mg/dl)" value={postTx.rbs} onChangeText={upd("rbs")} colors={colors} half keyboardType="numeric" editable={!disabled} />
        <FormField label="Weight (Kg)" value={postTx.weight} onChangeText={upd("weight")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>

      {/* ── Tx Time / Dialysate / UF / BLP ───────────────────────── */}
      <View style={s.formRow}>
        <FormField label="Tx Time (Hr)" value={postTx.txHr} onChangeText={upd("txHr")} colors={colors} half keyboardType="numeric" editable={!disabled} />
        <FormField label="Dialysate (L)" value={postTx.dialysateL} onChangeText={upd("dialysateL")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>
      <View style={s.formRow}>
        <FormField label="UF" value={postTx.uf} onChangeText={upd("uf")} colors={colors} half keyboardType="numeric" editable={!disabled} />
        <FormField label="BLP" value={postTx.blp} onChangeText={upd("blp")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>
      {/* ── Access ───────────────────────────────────────────────── */}
      <View style={s.formRow}>
        <FormField label="Catheter Lock" value={postTx.catheterLock} onChangeText={upd("catheterLock")} colors={colors} half placeholder="e.g. Heparin" editable={!disabled} />
        <FormField label="Arterial Access" value={postTx.arterialAccess} onChangeText={upd("arterialAccess")} colors={colors} half editable={!disabled} />
      </View>
      <View style={s.formRow}>
        <FormField label="Venous Access" value={postTx.venousAccess} onChangeText={upd("venousAccess")} colors={colors} half editable={!disabled} />
        <FormField label="UF Net" value={postTx.ufNet} onChangeText={upd("ufNet")} colors={colors} half keyboardType="numeric" editable={!disabled} />
      </View>

      {/* ── Machine Disinfected ───────────────────────────────────── */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.text }}>
          Machine Disinfected
        </Text>
        {([true, false] as const).map((val) => (
          <Pressable
            key={String(val)}
            onPress={() => !disabled && upd("machineDisinfected")(val)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 18, height: 18, borderRadius: 9,
                borderWidth: 2,
                borderColor: postTx.machineDisinfected === val ? Colors.primary : colors.border,
                alignItems: "center", justifyContent: "center",
              }}
            >
              {postTx.machineDisinfected === val && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary }} />
              )}
            </View>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.text }}>
              {val ? "YES" : "NO"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Notes / Incidences ───────────────────────────────────── */}
      <FormField
        label="Access Problems"
        value={postTx.accessProblems}
        onChangeText={upd("accessProblems")}
        colors={colors}
        placeholder="e.g. None"
        editable={!disabled}
      />
      <FormField
        label="Non-Medical Incidence"
        value={postTx.nonMedicalIncidence}
        onChangeText={upd("nonMedicalIncidence")}
        colors={colors}
        placeholder="e.g. None"
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
