import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface AllergiesFormData {
  drug_allergies: string;
  food_allergies: string;
  general_allergies: string;
  contamination: string;
}

const EMPTY: AllergiesFormData = {
  drug_allergies: "",
  food_allergies: "",
  general_allergies: "",
  contamination: "",
};

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: AllergiesFormData | null;
  isSaving?: boolean;
  onSave: (data: AllergiesFormData) => void;
  t: (key: any) => string;
}

const FIELDS: { key: keyof AllergiesFormData; label: string }[] = [
  { key: "drug_allergies", label: "Drug Allergies" },
  { key: "food_allergies", label: "Food Allergies" },
  { key: "general_allergies", label: "General Allergies" },
  { key: "contamination", label: "Contamination" },
];

export function AllergiesForm({
  colors,
  isReadOnly,
  initialExpanded,
  initial,
  isSaving = false,
  onSave,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<AllergiesFormData>(() => initial ?? { ...EMPTY });

  useEffect(() => {
    if (!initial) return;
    setData(initial);
  }, [initial]);

  const update = (key: keyof AllergiesFormData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(data);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData({ ...EMPTY });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("allergiesForm")}
        icon="alert-circle"
        iconColor="#F59E0B"
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 12 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        {FIELDS.map(({ key, label }) => (
          <View key={key}>
            <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
            <TextInput
              style={[
                s.formInput,
                { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              value={data[key]}
              onChangeText={(v) => update(key, v)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        ))}

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
