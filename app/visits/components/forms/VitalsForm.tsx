import React, { useCallback, useEffect } from "react";
import { Text, View } from "react-native";

import type { FlowSheetMobileVitals } from "@/data/models/flowSheet";
import { SelectField } from "@/components/ui/SelectField";
import { mobileFlowStyles as ms, visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

const METHOD_OPTIONS = ["Oral", "Axilla", "Tympanic", "Temporal"] as const;

const BP_SITE_OPTIONS = [
  "Right Upper Arm",
  "Left Upper Arm",
  "Right Forearm",
  "Left Forearm",
  "Right Wrist",
  "Left Wrist",
  "Right Thigh",
  "Left Thigh",
  "Right Ankle",
  "Left Ankle",
] as const;

/** Pulse-rate palpation site (maps to `pre_treatment_vital.pr` on the API). */
const PR_SITE_OPTIONS = [
  "Radial",
  "Carotid",
  "Apical",
  "Dorsalis pedis",
  "Popliteal",
] as const;

interface Props {
  vitals: FlowSheetMobileVitals;
  bpSite: string;
  method: string;
  onVitalChange: (key: keyof FlowSheetMobileVitals, v: string) => void;
  onBpSiteChange: (v: string) => void;
  onMethodChange: (v: string) => void;
  colors: any;
}

/**
 * UF Goal = Pre-weight − Dry weight, in kg. Returns "" when either input is
 * blank or non-numeric so the field shows empty rather than "NaN".
 */
function computeUfGoal(preWeight: string, dryWeight: string): string {
  const pre = parseFloat(preWeight);
  const dry = parseFloat(dryWeight);
  if (!Number.isFinite(pre) || !Number.isFinite(dry)) return "";
  const goal = pre - dry;
  return (Math.round(goal * 10) / 10).toFixed(1);
}

/**
 * BMI = weight (kg) / (height (m))². Height arrives in cm so we divide by 100.
 * Returns "" when either input is blank or non-numeric.
 */
function computeBmi(heightCm: string, preWeightKg: string): string {
  const h = parseFloat(heightCm);
  const w = parseFloat(preWeightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0) return "";
  const bmi = w / Math.pow(h / 100, 2);
  return (Math.round(bmi * 10) / 10).toFixed(1);
}

/** WHO BMI category bands + a colour for the inline status label. */
function bmiCategory(bmiStr: string): { label: string; color: string } | null {
  const v = parseFloat(bmiStr);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v < 18.5)  return { label: "Underweight",       color: "#F59E0B" };
  if (v < 25)    return { label: "Normal",            color: "#10B981" };
  if (v < 30)    return { label: "Overweight",        color: "#F59E0B" };
  if (v < 35)    return { label: "Obesity Class I",   color: "#EF4444" };
  if (v < 40)    return { label: "Obesity Class II",  color: "#EF4444" };
  return         { label: "Obesity Class III", color: "#DC2626" };
}

export function VitalsForm({ vitals, bpSite, method, onVitalChange, onBpSiteChange, onMethodChange, colors }: Props) {
  // Recompute UF Goal whenever pre/dry weight changes. We write it through
  // `onVitalChange` so the value persists with the rest of the vitals payload
  // on save — UF Goal is never edited directly by the nurse.
  const handlePreWeightChange = useCallback(
    (v: string) => {
      onVitalChange("preWeight", v);
      onVitalChange("ufGoal", computeUfGoal(v, vitals.dryWeight));
    },
    [onVitalChange, vitals.dryWeight],
  );

  const handleDryWeightChange = useCallback(
    (v: string) => {
      onVitalChange("dryWeight", v);
      onVitalChange("ufGoal", computeUfGoal(vitals.preWeight, v));
    },
    [onVitalChange, vitals.preWeight],
  );

  // Keep UF Goal in sync even when Pre/Dry come in from outside (e.g. a saved
  // visit hydrating the form). Only writes when the computed value actually
  // differs from current state, so no render loop.
  useEffect(() => {
    const next = computeUfGoal(vitals.preWeight, vitals.dryWeight);
    if (next !== (vitals.ufGoal ?? "")) {
      onVitalChange("ufGoal", next);
    }
  }, [vitals.preWeight, vitals.dryWeight, vitals.ufGoal, onVitalChange]);

  // Same pattern for BMI + its category label. The backend echoes these back
  // on GET; we recompute locally so the value updates live as the nurse types.
  const bmi = computeBmi(vitals.height, vitals.preWeight);
  const category = bmiCategory(bmi);
  useEffect(() => {
    if (bmi !== (vitals.bmi ?? "")) {
      onVitalChange("bmi", bmi);
    }
    const nextCat = category?.label ?? "";
    if (nextCat !== (vitals.bmiCategory ?? "")) {
      onVitalChange("bmiCategory", nextCat);
    }
  }, [bmi, category?.label, vitals.bmi, vitals.bmiCategory, onVitalChange]);

  return (
    <>
      <View>
        <FormField
          label="BMI"
          value={bmi}
          onChangeText={() => {}}
          colors={colors}
          keyboardType="decimal-pad"
          editable={false}
        />
        {category && (
          <Text style={{ marginTop: 4, fontSize: 12, fontFamily: "Inter_500Medium", color: category.color }}>
            {category.label}
          </Text>
        )}
      </View>
      <View style={s.formRow}>
        <FormField label="Height (Cm)" value={vitals.height} onChangeText={(v) => onVitalChange("height", v)} colors={colors} half keyboardType="numeric" />
        <FormField label="Pre Weight (Kg)" value={vitals.preWeight} onChangeText={handlePreWeightChange} colors={colors} half keyboardType="numeric" />
      </View>
      <View style={s.formRow}>
        <FormField label="Dry Weight (Kg)" value={vitals.dryWeight} onChangeText={handleDryWeightChange} colors={colors} half keyboardType="numeric" />
        <FormField
          label="UF Goal (Kg)"
          value={vitals.ufGoal}
          onChangeText={() => {}}
          colors={colors}
          half
          keyboardType="decimal-pad"
          editable={false}
        />
      </View>
      <Text style={[ms.subLabel, { color: colors.text }]}>BP (mmHg)</Text>
      <View style={s.formRow}>
        <FormField label="Systolic" value={vitals.bpSystolic} onChangeText={(v) => onVitalChange("bpSystolic", v)} colors={colors} half keyboardType="numeric" />
        <FormField label="Diastolic" value={vitals.bpDiastolic} onChangeText={(v) => onVitalChange("bpDiastolic", v)} colors={colors} half keyboardType="numeric" />
      </View>
      <SelectField
        label="Site"
        value={bpSite || null}
        options={BP_SITE_OPTIONS}
        placeholder="Choose site..."
        onChange={onBpSiteChange}
      />
      <View style={s.formRow}>
        <FormField label="Temperature (°C)" value={vitals.temperature} onChangeText={(v) => onVitalChange("temperature", v)} colors={colors} half keyboardType="decimal-pad" />
        <View style={{ flex: 1 }}>
          <SelectField
            label="Method"
            value={method || null}
            options={METHOD_OPTIONS}
            placeholder="Select method..."
            onChange={onMethodChange}
          />
        </View>
      </View>
      <View style={s.formRow}>
        <FormField label="SpO2 (%)" value={vitals.spo2} onChangeText={(v) => onVitalChange("spo2", v)} colors={colors} half keyboardType="numeric" />
        <FormField label="RBS (mg/dl)" value={vitals.rbs} onChangeText={(v) => onVitalChange("rbs", v)} colors={colors} half keyboardType="numeric" />
      </View>
      <View style={s.formRow}>
        <View style={{ flex: 1 }}>
          <SelectField
            label="PR Site"
            value={vitals.prSite || null}
            options={PR_SITE_OPTIONS}
            placeholder="Choose site..."
            onChange={(v) => onVitalChange("prSite", v)}
          />
        </View>
        <FormField label="PR (Bpm)" value={vitals.hr} onChangeText={(v) => onVitalChange("hr", v)} colors={colors} half keyboardType="numeric" />
      </View>
      <FormField label="RR (Rpm)" value={vitals.rr} onChangeText={(v) => onVitalChange("rr", v)} colors={colors} keyboardType="numeric" />
    </>
  );
}
