import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { SelectField } from "@/components/ui/SelectField";
import type { FlowSheetPainDetails } from "@/data/models/flowSheet";
import { mobileFlowStyles as ms, visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

/** Anatomical pain locations (maps to `pain_assessment.location` on the API). */
const PAIN_LOCATION_OPTIONS = [
  "Head", "Face", "Neck", "Shoulder", "Chest", "Back", "Abdomen", "Pelvis",
  "Arm", "Elbow", "Wrist", "Hand", "Hip", "Thigh", "Knee", "Leg", "Ankle",
  "Foot", "Generalized", "Other",
] as const;

/** Pain frequency (maps to `pain_assessment.frequency` on the API). */
const PAIN_FREQUENCY_OPTIONS = [
  "Once", "Daily", "Weekly", "Monthly", "Occasional", "Constant",
] as const;

/**
 * Pain quality / type — the three radio options. Backend stores the value
 * lowercase (e.g. `"dull"`), but we display Title Case to match the web form.
 */
const PAIN_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "constant", label: "Constant" },
  { value: "dull",     label: "Dull"     },
  { value: "sharp",    label: "Sharp"    },
];

interface Props {
  painScore: string;
  painDetails: FlowSheetPainDetails;
  onScoreChange: (v: string) => void;
  onDetailsChange: (details: FlowSheetPainDetails) => void;
  colors: any;
}

export function PainForm({ painScore, painDetails, onScoreChange, onDetailsChange, colors }: Props) {
  const set = (key: keyof FlowSheetPainDetails, v: string) =>
    onDetailsChange({ ...painDetails, [key]: v });

  return (
    <>
      <View style={s.formRow}>
        <FormField label="Tool Used" value={painDetails.toolUsed} onChangeText={(v) => set("toolUsed", v)} colors={colors} half />
        <View style={{ flex: 1 }}>
          <SelectField
            label="Location"
            value={painDetails.location || null}
            options={PAIN_LOCATION_OPTIONS}
            placeholder="Select Location"
            onChange={(v) => set("location", v)}
          />
        </View>
      </View>
      <View style={s.formRow}>
        <View style={{ flex: 1 }}>
          <SelectField
            label="Frequency"
            value={painDetails.frequency || null}
            options={PAIN_FREQUENCY_OPTIONS}
            placeholder="Select Frequency"
            onChange={(v) => set("frequency", v)}
          />
        </View>
        <FormField label="Radiating To" value={painDetails.radiatingTo} onChangeText={(v) => set("radiatingTo", v)} colors={colors} half />
      </View>
      <View style={{ marginTop: 6 }}>
        <Text style={[ms.subLabel, { color: colors.text }]}>Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {PAIN_TYPE_OPTIONS.map((opt) => {
            // Case-insensitive match so legacy / mixed-case server values still highlight.
            const selected = (painDetails.painType ?? "").trim().toLowerCase() === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => set("painType", opt.value)}
                style={[ms.radioBtn, selected && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              >
                <Text style={[ms.radioBtnText, selected && { color: "#fff" }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <FormField label="Occurs" value={painDetails.occurs} onChangeText={(v) => set("occurs", v)} colors={colors} />
      <View style={s.formRow}>
        <FormField label="Ambulating" value={painDetails.ambulating} onChangeText={(v) => set("ambulating", v)} colors={colors} half />
        <FormField label="Resting" value={painDetails.resting} onChangeText={(v) => set("resting", v)} colors={colors} half />
      </View>
      <View style={s.formRow}>
        <FormField label="Eating" value={painDetails.eating} onChangeText={(v) => set("eating", v)} colors={colors} half />
        <FormField label="Relieved By" value={painDetails.relievedBy} onChangeText={(v) => set("relievedBy", v)} colors={colors} half />
      </View>
      <FormField label="Worsens By" value={painDetails.worsensBy} onChangeText={(v) => set("worsensBy", v)} colors={colors} />
      <Text style={[ms.subLabel, { color: colors.text }]}>Pain Rating Score (0-10)</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
        {[...Array(11)].map((_, i) => (
          <Pressable
            key={i}
            onPress={() => onScoreChange(String(i))}
            style={[
              ms.scoreBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              painScore === String(i) && { backgroundColor: Colors.primary, borderColor: Colors.primary },
            ]}
          >
            <Text style={[ms.scoreBtnText, { color: colors.text }, painScore === String(i) && { color: "#fff" }]}>
              {i}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
