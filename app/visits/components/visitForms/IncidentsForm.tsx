import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { SelectField } from "@/components/ui/SelectField";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface IncidentsFormData {
  description: string;
  patient_dob: string;
  patient_mrn: string;
  reported_at: string;
  reported_by: string;
  patient_name: string;
  physician_id: string;
  incident_type: string;
  supervisor_id: string;
  reported_by_id: string;
  severity_level: string;
  immediate_actions: string;
  dialysis_session_time: string;
}

const EMPTY: IncidentsFormData = {
  description: "",
  patient_dob: "",
  patient_mrn: "",
  reported_at: "",
  reported_by: "",
  patient_name: "",
  physician_id: "",
  incident_type: "",
  supervisor_id: "",
  reported_by_id: "",
  severity_level: "",
  immediate_actions: "",
  dialysis_session_time: "",
};

const INCIDENT_TYPES = [
  "Patient Safety",
  "Medication Error",
  "Equipment Failure",
  "Fall",
  "Infection Control",
  "Clinical Deterioration",
  "Other",
] as const;

const SEVERITY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: IncidentsFormData | null;
  isSaving?: boolean;
  onSave: (data: IncidentsFormData) => void;
  t: (key: any) => string;
}

export function IncidentsForm({
  colors,
  isReadOnly,
  initialExpanded,
  initial,
  isSaving = false,
  onSave,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<IncidentsFormData>(() => initial ?? { ...EMPTY });

  useEffect(() => {
    if (!initial) return;
    setData(initial);
  }, [initial]);

  const update = (key: keyof IncidentsFormData, value: string) =>
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
        title={t("incidentsForm")}
        icon="alert-triangle"
        iconColor="#EF4444"
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 12 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        {/* Patient info */}
        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Patient Name</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.patient_name}
              onChangeText={(v) => update("patient_name", v)}
              placeholder="Full name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Patient MRN</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.patient_mrn}
              onChangeText={(v) => update("patient_mrn", v)}
              placeholder="MRN"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Patient DOB</Text>
            <DateTimeField
              mode="date"
              value={data.patient_dob}
              onChange={(v) => update("patient_dob", v)}
              colors={colors}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Dialysis Session Time</Text>
            <DateTimeField
              mode="time"
              value={data.dialysis_session_time}
              onChange={(v) => update("dialysis_session_time", v)}
              colors={colors}
            />
          </View>
        </View>

        {/* Incident details */}
        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Incident Type"
              value={data.incident_type || null}
              options={INCIDENT_TYPES}
              placeholder="Select type"
              onChange={(v) => update("incident_type", v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField
              label="Severity Level"
              value={data.severity_level || null}
              options={SEVERITY_LEVELS}
              placeholder="Select severity"
              onChange={(v) => update("severity_level", v)}
            />
          </View>
        </View>

        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Reported At</Text>
          <DateTimeField
            mode="datetime"
            value={data.reported_at}
            onChange={(v) => update("reported_at", v)}
            colors={colors}
          />
        </View>

        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Reported By</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.reported_by}
              onChangeText={(v) => update("reported_by", v)}
              placeholder="Username"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Reported By ID</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.reported_by_id}
              onChangeText={(v) => update("reported_by_id", v)}
              placeholder="User ID"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Physician ID</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.physician_id}
              onChangeText={(v) => update("physician_id", v)}
              placeholder="Physician ID"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Supervisor ID</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.supervisor_id}
              onChangeText={(v) => update("supervisor_id", v)}
              placeholder="Supervisor ID"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              s.formInput,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                minHeight: 70,
                textAlignVertical: "top",
              },
            ]}
            value={data.description}
            onChangeText={(v) => update("description", v)}
            placeholder="Describe the incident..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />
        </View>

        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Immediate Actions</Text>
          <TextInput
            style={[
              s.formInput,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                minHeight: 70,
                textAlignVertical: "top",
              },
            ]}
            value={data.immediate_actions}
            onChangeText={(v) => update("immediate_actions", v)}
            placeholder="Actions taken immediately..."
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
