import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { Card } from "@/components/common/Card";
import { ClickToSignButton } from "@/components/ui/ClickToSignButton";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface BloodSugarMonitorEntry {
  name: string;
  action: string;
  random: boolean;
  result: string;
  fasting: boolean;
  signed_at: string;
  signed_by: string;
}

export interface BloodSugarFormData {
  blood_sugar_monitor: BloodSugarMonitorEntry[];
  relevant_medication: string;
  other_relevant_medication: string;
}

type MedicationType = "insulin" | "other" | "oral_hypoglycemic" | "none";

const MEDICATION_OPTIONS: { key: MedicationType; labelKey: any }[] = [
  { key: "insulin", labelKey: "insulin" },
  { key: "other", labelKey: "other" },
  { key: "oral_hypoglycemic", labelKey: "oralHypoglycemicAgents" },
  { key: "none", labelKey: "none" },
];

const EMPTY_ENTRY = (): BloodSugarMonitorEntry => ({
  name: "",
  action: "",
  random: false,
  result: "",
  fasting: false,
  signed_at: "",
  signed_by: "",
});

function medicationTypeToApiValue(type: MedicationType): string {
  if (type === "insulin") return "Insulin";
  if (type === "other") return "Other";
  if (type === "oral_hypoglycemic") return "Oral Hypoglycemic Agents";
  return "None";
}

function apiValueToMedicationType(value: string): MedicationType {
  const v = value?.toLowerCase() ?? "";
  if (v.includes("insulin")) return "insulin";
  if (v.includes("oral")) return "oral_hypoglycemic";
  if (v === "none" || v === "") return "none";
  return "other";
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: BloodSugarFormData | null;
  isSaving?: boolean;
  onSave: (data: BloodSugarFormData) => void;
  t: (key: any) => string;
}

export function BloodSugarForm({
  colors,
  isReadOnly,
  initialExpanded,
  initial,
  isSaving = false,
  onSave,
  t,
}: Props) {
  const { user } = useApp();
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [monitor, setMonitor] = useState<BloodSugarMonitorEntry[]>(
    () => initial?.blood_sugar_monitor ?? [],
  );
  const [medication, setMedication] = useState<MedicationType>(
    () => apiValueToMedicationType(initial?.relevant_medication ?? ""),
  );

  useEffect(() => {
    if (!initial) return;
    setMonitor(initial.blood_sugar_monitor ?? []);
    setMedication(apiValueToMedicationType(initial.relevant_medication ?? ""));
  }, [initial]);

  const updateEntry = (
    index: number,
    key: keyof BloodSugarMonitorEntry,
    value: string | boolean,
  ) => {
    setMonitor((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)),
    );
  };

  const toggleBool = (index: number, key: "fasting" | "random") => {
    setMonitor((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [key]: !entry[key] } : entry,
      ),
    );
  };

  const signEntry = (index: number) => {
    const entry = monitor[index];
    if (entry.signed_at) {
      // Toggle off (un-sign)
      updateEntry(index, "signed_at", "");
      updateEntry(index, "signed_by", "");
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      updateEntry(index, "signed_at", new Date().toISOString());
      updateEntry(index, "signed_by", String(user?.id ?? ""));
    }
  };

  const addEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonitor((prev) => [...prev, EMPTY_ENTRY()]);
  };

  const removeEntry = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonitor((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      blood_sugar_monitor: monitor,
      relevant_medication: medicationTypeToApiValue(medication),
      other_relevant_medication: medication === "other" ? medicationTypeToApiValue("other") : "",
    });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMonitor([]);
    setMedication("none");
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("bloodSugarForm")}
        icon="activity"
        iconColor="#8B5CF6"
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 14 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        {/* Relevant Medications — radio row */}
        <View style={{ gap: 8 }}>
          <Text style={[s.formLabel, { color: colors.text }]}>
            {t("relevantMedications")}:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {MEDICATION_OPTIONS.map(({ key, labelKey }) => (
              <Pressable
                key={key}
                onPress={() => setMedication(key)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: medication === key ? Colors.primary : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {medication === key && (
                    <View
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 5,
                        backgroundColor: Colors.primary,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Inter_500Medium",
                    color: colors.text,
                  }}
                >
                  {t(labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Monitor entries */}
        {monitor.map((entry, index) => (
          <View
            key={index}
            style={[
              s.dynRow,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Pressable
              style={s.removeRowBtn}
              onPress={() => removeEntry(index)}
            >
              <Feather name="x" size={12} color="#fff" />
            </Pressable>

            {/* Row 1: Result | Fasting | Random — paddingRight clears the absolute X button */}
            <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end", paddingRight: 30 }}>
              <View style={{ flex: 2 }}>
                <Text style={[s.formLabel, { color: colors.text }]}>
                  {t("resultsMgDl")}
                </Text>
                <TextInput
                  style={[
                    s.formInput,
                    { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  value={entry.result}
                  onChangeText={(v) => updateEntry(index, "result", v)}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>

              <CheckboxToggle
                label={t("fasting")}
                value={entry.fasting}
                onToggle={() => toggleBool(index, "fasting")}
                colors={colors}
              />
              <CheckboxToggle
                label={t("random")}
                value={entry.random}
                onToggle={() => toggleBool(index, "random")}
                colors={colors}
              />
            </View>

            {/* Row 2: Action Taken */}
            <View>
              <Text style={[s.formLabel, { color: colors.text }]}>
                {t("actionTaken")}
              </Text>
              <TextInput
                style={[
                  s.formInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    minHeight: 60,
                    textAlignVertical: "top",
                  },
                ]}
                value={entry.action}
                onChangeText={(v) => updateEntry(index, "action", v)}
                placeholder={t("actionTaken")}
                placeholderTextColor={colors.textTertiary}
                multiline
              />
            </View>

            {/* Row 3: Name | Signature */}
            <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.formLabel, { color: colors.text }]}>
                  {t("name")}
                </Text>
                <TextInput
                  style={[
                    s.formInput,
                    { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  value={entry.name}
                  onChangeText={(v) => updateEntry(index, "name", v)}
                  placeholder={t("name")}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={{ flex: 1, alignItems: "flex-start", paddingBottom: 2 }}>
                <Text style={[s.formLabel, { color: colors.text }]}>
                  {t("signature")}
                </Text>
                <ClickToSignButton
                  signed={!!entry.signed_at}
                  signedAt={entry.signed_at || undefined}
                  unsignedLabel={t("clickToSign")}
                  signedLabel={t("signed")}
                  onPress={() => signEntry(index)}
                  disabled={isReadOnly}
                />
              </View>
            </View>
          </View>
        ))}

        <Pressable
          style={[
            s.addRowBtn,
            { borderWidth: 1, borderColor: Colors.primary, borderStyle: "dashed" },
          ]}
          onPress={addEntry}
        >
          <Feather name="plus-circle" size={16} color={Colors.primary} />
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Inter_600SemiBold",
              color: Colors.primary,
            }}
          >
            {t("addReading")}
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <Pressable
            style={[
              s.saveFlowBtn,
              { backgroundColor: !isSaving ? Colors.primary : colors.border, flex: 1 },
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="save" size={16} color="#fff" />
            )}
            <Text style={s.mainBtnText}>{isSaving ? t("saving") : t("save")}</Text>
          </Pressable>
          <Pressable
            style={[s.saveFlowBtn, { backgroundColor: "#EF4444", flex: 1 }]}
            onPress={handleClear}
          >
            <Feather name="trash-2" size={16} color="#fff" />
            <Text style={s.mainBtnText}>{t("clear")}</Text>
          </Pressable>
        </View>
      </CollapsibleBody>
    </Card>
  );
}

function CheckboxToggle({
  label,
  value,
  onToggle,
  colors,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={{ alignItems: "center", gap: 4, paddingBottom: 10 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: value ? Colors.primary : colors.border,
          backgroundColor: value ? Colors.primary : colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {value && <Feather name="check" size={13} color="#fff" />}
      </View>
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Inter_500Medium",
          color: colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
