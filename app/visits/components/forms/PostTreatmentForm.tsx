import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import type { FlowSheetMobilePostTx } from "@/types/flowSheet";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { FormField } from "../FormField";

interface Props {
  postTx: FlowSheetMobilePostTx;
  patientSigned: boolean;
  nurseSigned: boolean;
  onChange: (postTx: FlowSheetMobilePostTx) => void;
  onOpenPatientSignature: () => void;
  onOpenNurseSignature: () => void;
  colors: any;
}

export function PostTreatmentForm({
  postTx,
  patientSigned,
  nurseSigned,
  onChange,
  onOpenPatientSignature,
  onOpenNurseSignature,
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
        <SignatureButton
          label="Patient"
          signed={patientSigned}
          activeColor={Colors.primary}
          signedColor="#22C55E"
          iconIdle="edit-3"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenPatientSignature();
          }}
          colors={colors}
        />
        <SignatureButton
          label="Nurse"
          signed={nurseSigned}
          activeColor="#8B5CF6"
          signedColor="#22C55E"
          iconIdle="pen-tool"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenNurseSignature();
          }}
          colors={colors}
        />
      </View>
    </>
  );
}

function SignatureButton({
  label,
  signed,
  activeColor,
  signedColor,
  iconIdle,
  onPress,
  colors,
}: {
  label: string;
  signed: boolean;
  activeColor: string;
  signedColor: string;
  iconIdle: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        padding: 12,
        borderWidth: 1.5,
        borderColor: signed ? signedColor : activeColor,
        borderRadius: 12,
        borderStyle: signed ? "solid" : "dashed",
        backgroundColor: signed ? `${signedColor}18` : `${activeColor}15`,
        alignItems: "center",
        gap: 6,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: signed ? signedColor : activeColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={signed ? "check" : (iconIdle as any)} size={16} color="#fff" />
      </View>
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 13,
          color: signed ? signedColor : colors.text,
          textAlign: "center",
        }}
      >
        {label}
        {"\n"}Signature
      </Text>
      <View
        style={{
          backgroundColor: signed ? signedColor : colors.border,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}
      >
        <Text style={{ color: signed ? "#fff" : colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 10 }}>
          {signed ? "SIGNED" : "PENDING"}
        </Text>
      </View>
    </Pressable>
  );
}
