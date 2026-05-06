import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import type { FlowSheetPainDetails } from "@/data/models/flowSheet";
import { mobileFlowStyles as ms, visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

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
        <FormField label="Location" value={painDetails.location} onChangeText={(v) => set("location", v)} colors={colors} half placeholder="Select Location" />
      </View>
      <View style={s.formRow}>
        <FormField label="Frequency" value={painDetails.frequency} onChangeText={(v) => set("frequency", v)} colors={colors} half placeholder="Select Frequency" />
        <FormField label="Radiating To" value={painDetails.radiatingTo} onChangeText={(v) => set("radiatingTo", v)} colors={colors} half />
      </View>
      <View style={s.formRow}>
        <FormField label="Pain Type" value={painDetails.painType} onChangeText={(v) => set("painType", v)} colors={colors} half placeholder="e.g. Dull / Sharp" />
        <FormField label="Occurs" value={painDetails.occurs} onChangeText={(v) => set("occurs", v)} colors={colors} half />
      </View>
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
