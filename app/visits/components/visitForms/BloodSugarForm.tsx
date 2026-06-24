import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Card } from "@/components/common/Card";
import { DateTimeField } from "@/components/ui/DateTimeField";
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

const EMPTY_ENTRY = (): BloodSugarMonitorEntry => ({
  name: "",
  action: "",
  random: false,
  result: "",
  fasting: false,
  signed_at: "",
  signed_by: "",
});

const EMPTY: BloodSugarFormData = {
  blood_sugar_monitor: [],
  relevant_medication: "",
  other_relevant_medication: "",
};

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
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [monitor, setMonitor] = useState<BloodSugarMonitorEntry[]>(
    () => initial?.blood_sugar_monitor ?? [],
  );
  const [medication, setMedication] = useState(initial?.relevant_medication ?? "");
  const [otherMedication, setOtherMedication] = useState(
    initial?.other_relevant_medication ?? "",
  );

  useEffect(() => {
    if (!initial) return;
    setMonitor(initial.blood_sugar_monitor ?? []);
    setMedication(initial.relevant_medication ?? "");
    setOtherMedication(initial.other_relevant_medication ?? "");
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
      relevant_medication: medication,
      other_relevant_medication: otherMedication,
    });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMonitor([]);
    setMedication("");
    setOtherMedication("");
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
        {/* Blood Sugar Monitor entries */}
        <Text style={[s.formSubhead, { color: colors.text }]}>Blood Sugar Monitor</Text>

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

            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.formLabel, { color: colors.text }]}>Name</Text>
                <TextInput
                  style={[s.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={entry.name}
                  onChangeText={(v) => updateEntry(index, "name", v)}
                  placeholder="Patient name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.formLabel, { color: colors.text }]}>Result</Text>
                <TextInput
                  style={[s.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={entry.result}
                  onChangeText={(v) => updateEntry(index, "result", v)}
                  placeholder="mg/dL"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View>
              <Text style={[s.formLabel, { color: colors.text }]}>Action</Text>
              <TextInput
                style={[s.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                value={entry.action}
                onChangeText={(v) => updateEntry(index, "action", v)}
                placeholder="Action taken"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={s.formRow}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.background }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.text }}>Random</Text>
                <Switch
                  value={entry.random}
                  onValueChange={(v) => updateEntry(index, "random", v)}
                  trackColor={{ true: Colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.background }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.text }}>Fasting</Text>
                <Switch
                  value={entry.fasting}
                  onValueChange={(v) => updateEntry(index, "fasting", v)}
                  trackColor={{ true: Colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.formLabel, { color: colors.text }]}>Signed At</Text>
                <DateTimeField
                  mode="datetime"
                  value={entry.signed_at}
                  onChange={(v) => updateEntry(index, "signed_at", v)}
                  colors={colors}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.formLabel, { color: colors.text }]}>Signed By (ID)</Text>
                <TextInput
                  style={[s.formInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={entry.signed_by}
                  onChangeText={(v) => updateEntry(index, "signed_by", v)}
                  placeholder="User ID"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        ))}

        <Pressable
          style={[s.addRowBtn, { borderWidth: 1, borderColor: Colors.primary, borderStyle: "dashed" }]}
          onPress={addEntry}
        >
          <Feather name="plus-circle" size={16} color={Colors.primary} />
          <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary }}>
            Add Reading
          </Text>
        </Pressable>

        {/* Medication fields */}
        <View style={{ height: 1, backgroundColor: colors.border }} />

        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Relevant Medication</Text>
          <TextInput
            style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            value={medication}
            onChangeText={setMedication}
            placeholder="e.g. Insulin"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Other Relevant Medication</Text>
          <TextInput
            style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            value={otherMedication}
            onChangeText={setOtherMedication}
            placeholder="Other medications"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <Pressable
            style={[s.saveFlowBtn, { backgroundColor: !isSaving ? Colors.primary : colors.border, flex: 1 }]}
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
