import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";

interface Props {
  visible: boolean;
  morseTotal: number;
  morseA: number | null;
  morseB: number | null;
  morseC: number | null;
  morseD: number | null;
  morseE: number | null;
  morseF: number | null;
  morseActions: Record<string, boolean>;
  setMorseA: (v: number) => void;
  setMorseB: (v: number) => void;
  setMorseC: (v: number) => void;
  setMorseD: (v: number) => void;
  setMorseE: (v: number) => void;
  setMorseF: (v: number) => void;
  setMorseActions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onDone: () => void;
  onClose: () => void;
  colors: any;
}

type Item = { label: string; state: number | null; setState: (v: number) => void; options: { label: string; value: number }[] };

export function MorseFallScaleSheet(props: Props) {
  const insets = useSafeAreaInsets();
  const { colors, morseTotal } = props;
  const riskColor = morseTotal >= 45 ? "#EF4444" : morseTotal >= 25 ? "#F59E0B" : "#22C55E";
  const riskLabel = morseTotal >= 45 ? "HIGH RISK" : morseTotal >= 25 ? "MODERATE RISK" : "LOW RISK";

  const items: Item[] = [
    { label: "A. History of Falling (immediate or < 3 months)", state: props.morseA, setState: props.setMorseA, options: [{ label: "No", value: 0 }, { label: "Yes", value: 25 }] },
    { label: "B. Secondary Diagnosis", state: props.morseB, setState: props.setMorseB, options: [{ label: "No", value: 0 }, { label: "Yes", value: 15 }] },
    { label: "C. Ambulatory Aid", state: props.morseC, setState: props.setMorseC, options: [{ label: "None / Bedrest / Nurse assist", value: 0 }, { label: "Crutches / Cane / Walker", value: 15 }, { label: "Furniture", value: 30 }] },
    { label: "D. IV Therapy / Heparin Lock", state: props.morseD, setState: props.setMorseD, options: [{ label: "No", value: 0 }, { label: "Yes", value: 20 }] },
    { label: "E. Gait / Transfer", state: props.morseE, setState: props.setMorseE, options: [{ label: "Normal / Bedrest / Wheelchair", value: 0 }, { label: "Weak gait", value: 10 }, { label: "Impaired gait", value: 20 }] },
    { label: "F. Mental Status", state: props.morseF, setState: props.setMorseF, options: [{ label: "Oriented to own ability", value: 0 }, { label: "Forgets limitations", value: 15 }] },
  ];

  const groups = [
    { group: "LOW RISK (0–24)", color: "#22C55E", bg: "#D1FAE5", actions: ["standard_fp", "patient_edu", "safe_env"], labels: { standard_fp: "Standard fall precautions", patient_edu: "Patient education", safe_env: "Safe environment review" } },
    { group: "MODERATE RISK (25–44)", color: "#F59E0B", bg: "#FEF3C7", actions: ["assist_amb", "bed_low", "review_meds", "reassess_24"], labels: { assist_amb: "Assist with ambulation", bed_low: "Keep bed low and locked", review_meds: "Review medications", reassess_24: "Reassess within 24 hours" } },
    { group: "HIGH RISK (≥45)", color: "#EF4444", bg: "#FEE2E2", actions: ["hr_protocol", "bed_alarm", "nurse_mobility", "freq_monitor", "family_edu", "reassess_shift"], labels: { hr_protocol: "High-risk fall protocol", bed_alarm: "Bed alarm if available", nurse_mobility: "Nurse-assisted mobility", freq_monitor: "Frequent monitoring", family_edu: "Family/caregiver education", reassess_shift: "Reassess every shift" } },
  ];

  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={props.onClose} />
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: "85%", maxHeight: "95%", flex: 1 }}>
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="clipboard" size={18} color="#F59E0B" />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.text }}>Morse Fall Scale Items</Text>
          </View>
          <Pressable onPress={props.onClose} style={{ padding: 4 }}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.textSecondary }}>Total Morse Score</Text>
          <View style={{ backgroundColor: riskColor, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" }}>{morseTotal}</Text>
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: "#fff" }}>{riskLabel}</Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {items.map((item) => (
            <View key={item.label} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#F59E0B", marginBottom: 8 }}>{item.label}</Text>
              <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 4, marginBottom: 4 }}>
                <Text style={{ flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary }}>Option</Text>
                <Text style={{ width: 50, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>Score</Text>
                <Text style={{ width: 40, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>Pick</Text>
              </View>
              {item.options.map((opt) => (
                <Pressable key={opt.value} onPress={() => { Haptics.selectionAsync(); item.setState(opt.value); }} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7 }}>
                  <Text style={{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text }}>{opt.label}</Text>
                  <Text style={{ width: 50, fontFamily: "Inter_500Medium", fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>{opt.value}</Text>
                  <View style={{ width: 40, alignItems: "center" }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: item.state === opt.value ? Colors.primary : colors.border, backgroundColor: item.state === opt.value ? Colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {item.state === opt.value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}

          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.text, marginBottom: 10 }}>5. Recommended Actions Based on Risk Score</Text>
            {groups.map((group) => (
              <View key={group.group} style={{ marginBottom: 10 }}>
                <View style={{ backgroundColor: group.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 6 }}>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: group.color }}>{group.group}</Text>
                </View>
                {group.actions.map((key) => (
                  <Pressable key={key} onPress={() => { Haptics.selectionAsync(); props.setMorseActions((p) => ({ ...p, [key]: !p[key] })); }} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: props.morseActions[key] ? Colors.primary : colors.border, backgroundColor: props.morseActions[key] ? Colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {props.morseActions[key] && <Feather name="check" size={11} color="#fff" />}
                    </View>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text }}>{(group.labels as any)[key]}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              props.onDone();
            }}
            style={{ backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
