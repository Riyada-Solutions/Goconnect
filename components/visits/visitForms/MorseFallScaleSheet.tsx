import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
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
  /** Triggered when the user taps Save. Should return a promise that
   *  resolves on success and rejects on error. The sheet closes itself when
   *  the promise resolves; on rejection it stays open and shows the message
   *  above the button so the nurse can retry without losing their work. */
  onSave: () => Promise<void>;
  onClose: () => void;
  colors: any;
}

type Item = { label: string; state: number | null; setState: (v: number) => void; options: { label: string; value: number }[] };

export function MorseFallScaleSheet(props: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const { colors, morseTotal } = props;
  const riskColor = morseTotal >= 45 ? "#EF4444" : morseTotal >= 25 ? "#F59E0B" : "#22C55E";
  const riskLabel = morseTotal >= 45 ? t("morseHighRisk") : morseTotal >= 25 ? t("morseModerateRisk") : t("morseLowRisk");

  const allFilled =
    props.morseA != null && props.morseB != null && props.morseC != null &&
    props.morseD != null && props.morseE != null && props.morseF != null;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reset transient state whenever the sheet is reopened.
  useEffect(() => {
    if (props.visible) {
      setBusy(false);
      setError(null);
    }
  }, [props.visible]);

  const handleSave = async () => {
    if (!allFilled || busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusy(true);
    setError(null);
    try {
      await props.onSave();
      props.onClose();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : t("morseSaveFailed"));
      setBusy(false);
    }
  };

  const items: Item[] = [
    { label: t("morseItemA"), state: props.morseA, setState: props.setMorseA, options: [{ label: t("morseOptNo"), value: 0 }, { label: t("morseOptYes"), value: 25 }] },
    { label: t("morseItemB"), state: props.morseB, setState: props.setMorseB, options: [{ label: t("morseOptNo"), value: 0 }, { label: t("morseOptYes"), value: 15 }] },
    { label: t("morseItemC"), state: props.morseC, setState: props.setMorseC, options: [{ label: t("morseOptNoneBedrest"), value: 0 }, { label: t("morseOptCrutches"), value: 15 }, { label: t("morseOptFurniture"), value: 30 }] },
    { label: t("morseItemD"), state: props.morseD, setState: props.setMorseD, options: [{ label: t("morseOptNo"), value: 0 }, { label: t("morseOptYes"), value: 20 }] },
    { label: t("morseItemE"), state: props.morseE, setState: props.setMorseE, options: [{ label: t("morseOptNormalBedrest"), value: 0 }, { label: t("morseOptWeakGait"), value: 10 }, { label: t("morseOptImpairedGait"), value: 20 }] },
    { label: t("morseItemF"), state: props.morseF, setState: props.setMorseF, options: [{ label: t("morseOptOrientedOwn"), value: 0 }, { label: t("morseOptForgetsLimits"), value: 15 }] },
  ];

  const groups = [
    { group: t("morseLowRiskRange"), color: "#22C55E", bg: "#D1FAE5", actions: ["standard_fp", "patient_edu", "safe_env"], labels: { standard_fp: t("morseActStandardFP"), patient_edu: t("morseActPatientEdu"), safe_env: t("morseActSafeEnv") } },
    { group: t("morseModerateRiskRange"), color: "#F59E0B", bg: "#FEF3C7", actions: ["assist_amb", "bed_low", "review_meds", "reassess_24"], labels: { assist_amb: t("morseActAssistAmb"), bed_low: t("morseActBedLow"), review_meds: t("morseActReviewMeds"), reassess_24: t("morseActReassess24") } },
    { group: t("morseHighRiskRange"), color: "#EF4444", bg: "#FEE2E2", actions: ["hr_protocol", "bed_alarm", "nurse_mobility", "freq_monitor", "family_edu", "reassess_shift"], labels: { hr_protocol: t("morseActHrProtocol"), bed_alarm: t("morseActBedAlarm"), nurse_mobility: t("morseActNurseMobility"), freq_monitor: t("morseActFreqMonitor"), family_edu: t("morseActFamilyEdu"), reassess_shift: t("morseActReassessShift") } },
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
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.text }}>{t("morseFallScaleItems")}</Text>
          </View>
          <Pressable onPress={props.onClose} style={{ padding: 4 }}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.textSecondary }}>{t("totalMorseScore")}</Text>
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
                <Text style={{ flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary }}>{t("morseOptionCol")}</Text>
                <Text style={{ width: 50, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>{t("morseScoreCol")}</Text>
                <Text style={{ width: 40, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>{t("morsePickCol")}</Text>
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
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.text, marginBottom: 10 }}>{t("morseRecommendedActions")}</Text>
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
          {error ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, padding: 10, borderRadius: 10, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FCA5A5" }}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={{ flex: 1, color: "#DC2626", fontFamily: "Inter_500Medium", fontSize: 12 }}>
                {error}
              </Text>
            </View>
          ) : !allFilled ? (
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "center", marginBottom: 8 }}>
              {t("morseSelectAll")}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSave}
            disabled={!allFilled || busy}
            style={{
              backgroundColor: allFilled ? Colors.primary : "#9CA3AF",
              opacity: busy ? 0.7 : 1,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="save" size={15} color="#fff" />
            )}
            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>
              {busy ? t("saving") : t("save")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
