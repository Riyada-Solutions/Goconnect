import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import { mobileFlowStyles as ms } from "../../visit-detail.styles";

interface Props {
  fallRisk: string;
  highFallRisk: boolean;
  morseComplete: boolean;
  morseTotal: number;
  morseValues: { a: number | null; b: number | null; c: number | null; d: number | null; e: number | null; f: number | null };
  physicianCalled: "yes" | "no" | null;
  onFallRiskChange: (v: string, highRisk: boolean) => void;
  onHighFallRiskChange: (v: boolean) => void;
  onOpenMorseSheet: () => void;
  colors: any;
}

export function FallRiskForm({
  fallRisk,
  highFallRisk,
  morseComplete,
  morseTotal,
  morseValues,
  physicianCalled,
  onFallRiskChange,
  onHighFallRiskChange,
  onOpenMorseSheet,
  colors,
}: Props) {
  const riskColor = morseTotal >= 45 ? "#EF4444" : morseTotal >= 25 ? "#F59E0B" : "#22C55E";
  const riskBg = morseTotal >= 45 ? "#EF444418" : morseTotal >= 25 ? "#F59E0B18" : "#22C55E18";
  const riskLabel = morseTotal >= 45 ? "HIGH RISK" : morseTotal >= 25 ? "MODERATE RISK" : "LOW RISK";

  const summary: { label: string; value: number | null; opts: { v: number; l: string }[] }[] = [
    { label: "A. History of Falling", value: morseValues.a, opts: [{ v: 0, l: "No" }, { v: 25, l: "Yes" }] },
    { label: "B. Secondary Diagnosis", value: morseValues.b, opts: [{ v: 0, l: "No" }, { v: 15, l: "Yes" }] },
    { label: "C. Ambulatory Aid", value: morseValues.c, opts: [{ v: 0, l: "None/Nurse assist" }, { v: 15, l: "Crutches/Cane/Walker" }, { v: 30, l: "Furniture" }] },
    { label: "D. IV Therapy", value: morseValues.d, opts: [{ v: 0, l: "No" }, { v: 20, l: "Yes" }] },
    { label: "E. Gait / Transfer", value: morseValues.e, opts: [{ v: 0, l: "Normal/Bedrest" }, { v: 10, l: "Weak gait" }, { v: 20, l: "Impaired gait" }] },
    { label: "F. Mental Status", value: morseValues.f, opts: [{ v: 0, l: "Oriented" }, { v: 15, l: "Forgets limitations" }] },
  ];

  return (
    <>
      <Text style={[ms.subLabel, { color: colors.text }]}>Fall Risk Score</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
        {[...Array(10)].map((_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              Haptics.selectionAsync();
              onFallRiskChange(String(i), i > 3);
            }}
            style={[
              ms.scoreBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              fallRisk === String(i) && { backgroundColor: Colors.primary, borderColor: Colors.primary },
            ]}
          >
            <Text style={[ms.scoreBtnText, { color: colors.text }, fallRisk === String(i) && { color: "#fff" }]}>
              {i}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onOpenMorseSheet();
        }}
        style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F59E0B18", borderWidth: 1.5, borderColor: "#F59E0B", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="clipboard" size={16} color="#F59E0B" />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#F59E0B" }}>Morse Fall Scale</Text>
        </View>
        {morseComplete ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ backgroundColor: riskColor, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>Score: {morseTotal}</Text>
            </View>
            <Feather name="chevron-right" size={14} color="#F59E0B" />
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#F59E0B" }}>Fill Form</Text>
            <Feather name="chevron-right" size={14} color="#F59E0B" />
          </View>
        )}
      </Pressable>

      {morseComplete && (
        <View style={{ marginTop: 10, backgroundColor: riskBg, borderRadius: 8, padding: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: riskColor }}>
            {riskLabel} — Total Score: {morseTotal}
          </Text>
          {summary.map((item) => (
            <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textSecondary, flex: 1 }}>
                {item.label}
              </Text>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text }}>
                {item.opts.find((o) => o.v === item.value)?.l ?? ""} ({item.value})
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={[ms.switchRow, { marginTop: 10 }]}>
        <Text style={[ms.switchLabel, { color: colors.text }]}>High Risk?</Text>
        <Switch
          value={highFallRisk}
          onValueChange={onHighFallRiskChange}
          trackColor={{ false: colors.border, true: `${Colors.primary}60` }}
          thumbColor={highFallRisk ? Colors.primary : "#f4f3f4"}
        />
      </View>
      <View
        style={[
          ms.noticeBox,
          { backgroundColor: physicianCalled === "yes" ? "#22C55E18" : physicianCalled === "no" ? "#EF444418" : "#3B82F618" },
        ]}
      >
        <Text
          style={{
            color: physicianCalled === "yes" ? "#065F46" : physicianCalled === "no" ? "#B91C1C" : Colors.primary,
            fontFamily: "Inter_500Medium",
            fontSize: 12,
          }}
        >
          {physicianCalled === "yes"
            ? "Physician Notified: Yes"
            : physicianCalled === "no"
              ? "Physician Notified: No"
              : "Physician notification pending"}
        </Text>
      </View>
    </>
  );
}
