import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { SelectField } from "@/components/ui/SelectField";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface SocialAssessmentFormData {
  patient_id: string;
  profession: string;
  data_source: string;
  marital_status: string;
  primary_doctor: string;
  assessment_type: string;
  education_level: string;
  facility_status: string;
  limited_ability: string;
  physical_status: string;
  social_assessment: string;
}

const EMPTY: SocialAssessmentFormData = {
  patient_id: "",
  profession: "",
  data_source: "",
  marital_status: "",
  primary_doctor: "",
  assessment_type: "",
  education_level: "",
  facility_status: "",
  limited_ability: "",
  physical_status: "",
  social_assessment: "",
};

const DATA_SOURCES = ["Patient", "Family", "Facilities", "Medical Records", "Other"] as const;
const MARITAL_STATUSES = [
  { value: "married", label: "Married" },
  { value: "single", label: "Single" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;
const ASSESSMENT_TYPES = [
  { value: "initial_assessment", label: "Initial Assessment" },
  { value: "re_assessment", label: "Re-Assessment" },
] as const;
const EDUCATION_LEVELS = [
  { value: "illiterate", label: "Illiterate" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "university", label: "University" },
  { value: "postgraduate", label: "Postgraduate" },
] as const;
const FACILITY_STATUSES = [
  { value: "good", label: "Good" },
  { value: "medium", label: "Medium" },
  { value: "poor", label: "Poor" },
] as const;
const LIMITED_ABILITY_OPTIONS = [
  { value: "aware", label: "Aware" },
  { value: "unaware", label: "Unaware" },
  { value: "partial", label: "Partial" },
] as const;
const PHYSICAL_STATUSES = [
  { value: "able_to_move", label: "Able to Move" },
  { value: "limited_mobility", label: "Limited Mobility" },
  { value: "bed_ridden", label: "Bed Ridden" },
] as const;

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: SocialAssessmentFormData | null;
  isSaving?: boolean;
  onSave: (data: SocialAssessmentFormData) => void;
  t: (key: any) => string;
}

export function SocialAssessmentForm({
  colors,
  isReadOnly,
  initialExpanded,
  initial,
  isSaving = false,
  onSave,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<SocialAssessmentFormData>(() => initial ?? { ...EMPTY });

  useEffect(() => {
    if (!initial) return;
    setData(initial);
  }, [initial]);

  const update = (key: keyof SocialAssessmentFormData, value: string) =>
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
        title={t("socialAssessmentForm")}
        icon="users"
        iconColor="#0891B2"
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 12 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        {/* Patient ID & Profession */}
        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Patient ID</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.patient_id}
              onChangeText={(v) => update("patient_id", v)}
              placeholder="Patient ID"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Profession</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.profession}
              onChangeText={(v) => update("profession", v)}
              placeholder="e.g. unemployed"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Assessment Type & Data Source */}
        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Assessment Type"
              value={data.assessment_type || null}
              options={ASSESSMENT_TYPES}
              placeholder="Select type"
              onChange={(v) => update("assessment_type", v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Data Source"
              value={data.data_source || null}
              options={DATA_SOURCES}
              placeholder="Select source"
              onChange={(v) => update("data_source", v)}
            />
          </View>
        </View>

        {/* Marital Status & Education Level */}
        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Marital Status"
              value={data.marital_status || null}
              options={MARITAL_STATUSES}
              placeholder="Select status"
              onChange={(v) => update("marital_status", v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Education Level"
              value={data.education_level || null}
              options={EDUCATION_LEVELS}
              placeholder="Select level"
              onChange={(v) => update("education_level", v)}
            />
          </View>
        </View>

        {/* Primary Doctor */}
        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Primary Doctor</Text>
          <TextInput
            style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            value={data.primary_doctor}
            onChangeText={(v) => update("primary_doctor", v)}
            placeholder="Doctor username"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Facility Status, Limited Ability, Physical Status */}
        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Facility Status"
              value={data.facility_status || null}
              options={FACILITY_STATUSES}
              placeholder="Select"
              onChange={(v) => update("facility_status", v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Limited Ability"
              value={data.limited_ability || null}
              options={LIMITED_ABILITY_OPTIONS}
              placeholder="Select"
              onChange={(v) => update("limited_ability", v)}
            />
          </View>
        </View>

        <SelectField
          label="Physical Status"
          value={data.physical_status || null}
          options={PHYSICAL_STATUSES}
          placeholder="Select physical status"
          onChange={(v) => update("physical_status", v)}
        />

        {/* Social Worker Assessment notes */}
        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Social Worker Assessment Notes</Text>
          <TextInput
            style={[
              s.formInput,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                minHeight: 80,
                textAlignVertical: "top",
              },
            ]}
            value={data.social_assessment}
            onChangeText={(v) => update("social_assessment", v)}
            placeholder="Enter assessment notes..."
            placeholderTextColor={colors.textTertiary}
            multiline
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
