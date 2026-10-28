import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { AttestField } from "@/components/ui/AttestField";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import { SelectField } from "@/components/ui/SelectField";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Acc } from "../Acc";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { IcdCodePicker } from "./IcdCodePicker";

/**
 * Wire shape of `patient-assessment-new` (see the "Patient Assessment (New)"
 * Postman collection). Key names match the web form exactly, typos included
 * (`lung_ausculation`, `emergancy_contact_person`, `contanct_no`).
 *
 * The server REPLACES the whole form on each save, so the full object read
 * from the visit is kept in state and sent back as-is — any legacy sections
 * we don't render (`social_hostory`, `surgical_history`, `referral`, …) ride
 * along via the index signature instead of being deleted.
 */
export interface PatientAssessmentNewData {
  allergy?: string | null;
  date_performed?: string | null;
  initial_assessment?: "initial" | "reassessment" | null;
  impression_and_plan?: string | null;
  history_given_by?: string | null;
  relationship_to_patient?: string | null;
  designation?: string | null;
  history: Record<string, any>;
  medical_surgical_history: Record<string, any>;
  assessment: Record<string, any>;
  patient_information: Record<string, any>;
  assessment_signature_signed_at: string | null;
  assessment_signature_signed_by: string | number | null;
  [legacyKey: string]: unknown;
}

export const EMPTY_PATIENT_ASSESSMENT_NEW: PatientAssessmentNewData = {
  history: {},
  medical_surgical_history: { icd_code: [] },
  assessment: {},
  patient_information: {},
  assessment_signature_signed_at: null,
  assessment_signature_signed_by: null,
};

type Opt = { value: string; label: string };
type Section = "history" | "medical_surgical_history" | "assessment";

// Labels below mirror the web form (Patient Assessment) exactly.
const YES_NO: Opt[] = [
  { value: "yes", label: "yes" },
  { value: "no", label: "no" },
];

const ASSESSMENT_TYPE: Opt[] = [
  { value: "initial", label: "Initial Assessment" },
  { value: "reassessment", label: "Re-Assessment" },
];

const MENTAL_STATUS_OPTIONS: Opt[] = [
  { value: "oriented", label: "Oriented" }, { value: "forgetful", label: "Forgetful" },
  { value: "disoriented", label: "Disoriented" }, { value: "comatose", label: "Comatose" },
  { value: "agitated", label: "Agitated" }, { value: "depressed", label: "Depressed" },
  { value: "lethargic", label: "Lethargic" }, { value: "other", label: "Others" },
];

const PATIENT_ALERT: Opt[] = [
  { value: "Always", label: "Always" },
  { value: "Sometimes", label: "Sometimes" },
  { value: "Never", label: "Never" },
];

const CONTRAPTIONS_G1: Opt[] = [
  { value: "IV", label: "IV" }, { value: "Feeding", label: "Feeding Pump" },
  { value: "Ventilator", label: "Ventilator" }, { value: "Oxygen", label: "Oxygen" },
  { value: "Pump", label: "IV Pump" }, { value: "Assistive", label: "Assistive Device" },
];
// "Others" is UI-only: the API has no such g2 value — the text goes to
// `contraptions_equipment_g2_others` and g2 is sent as null (see serializer).
export const CONTRAPTIONS_G2_OTHERS = "Others";
const CONTRAPTIONS_G2: Opt[] = [
  { value: "Catheter", label: "Catheter" }, { value: "Feeding_tube", label: "Feeding Tube" },
  { value: "Nebulizer", label: "Nebulizer" }, { value: "BiPAP_CPAP", label: "BiPAP/CPAP" },
  { value: "Drains", label: "Drains" }, { value: CONTRAPTIONS_G2_OTHERS, label: "Others" },
];

const HISTORY_FIELDS: { key: string; label: string }[] = [
  { key: "medical_history", label: "Medical History" },
  { key: "surgical_history", label: "Surgical History" },
  { key: "family_medical_history", label: "Family Medical History" },
  { key: "social_history", label: "Social History" },
  { key: "medication_history", label: "Medication History" },
];

// Keys cleared by the Physical examination card's "Clear All".
const PHYSICAL_EXAM_CONTRAPTION_KEYS = [
  "contraptions_equipment_g1", "contraptions_equipment_g1_assistive",
  "contraptions_equipment_g2", "contraptions_equipment_g2_others",
];

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  /** Saved form (or the prefilled blank form). `null` until the visit loads. */
  initial?: PatientAssessmentNewData | null;
  isSaving?: boolean;
  onSave: (data: PatientAssessmentNewData) => void;
  currentUserId: string | number;
  currentUserName?: string;
  t: (key: any) => string;
}

function TextField({
  label, value, onChangeText, colors, multiline, numeric, unit, labelColor, placeholder, minWidth = "45%",
}: {
  label: string; value: string; onChangeText: (v: string) => void; colors: any; multiline?: boolean;
  numeric?: boolean; unit?: string; labelColor?: string; placeholder?: string; minWidth?: string;
}) {
  return (
    <View style={{ flex: 1, minWidth: minWidth as any }}>
      <Text style={[s.formLabel, { color: labelColor ?? colors.text }]}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <TextInput
          style={[
            s.formInput,
            {
              flex: 1,
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              minHeight: multiline ? 80 : undefined,
              textAlignVertical: multiline ? "top" : "center",
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline={multiline}
          keyboardType={numeric ? "decimal-pad" : "default"}
        />
        {unit ? <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.textSecondary }}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function RadioGroup({
  label, options, value, onChange, colors, disabled, error, columns,
}: {
  label?: string; options: Opt[]; value: string; onChange: (v: string | null) => void; colors: any;
  disabled?: boolean; error?: boolean; columns?: number;
}) {
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4 }}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              // Tapping the selected option clears it — every field is nullable.
              onPress={() => !disabled && onChange(selected ? null : opt.value)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, opacity: disabled ? 0.6 : 1,
                width: columns ? `${100 / columns - 4}%` : undefined,
              }}
            >
              <View
                style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                  borderColor: selected ? Colors.primary : error ? "#EF4444" : colors.border,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary }} />}
              </View>
              <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.text }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#EF4444" }}>Required</Text> : null}
    </View>
  );
}

const SubTitle = ({ children }: { children: string }) => (
  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>{children}</Text>
);

const Divider = ({ colors }: { colors: any }) => (
  <View style={{ height: 1, backgroundColor: colors.borderLight }} />
);

function ClearAllButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  if (disabled) return null;
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={{ alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EF4444", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}
    >
      <Feather name="rotate-ccw" size={12} color="#fff" />
      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#fff" }}>Clear All</Text>
    </Pressable>
  );
}

const str = (v: unknown) => (v == null ? "" : String(v));

export function PatientAssessmentNewForm({
  colors, isReadOnly, initialExpanded, initial, isSaving = false, onSave, currentUserId, currentUserName, t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<PatientAssessmentNewData>(() => initial ?? EMPTY_PATIENT_ASSESSMENT_NEW);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [sections, setSections] = useState<Record<string, boolean>>({});
  const { dialogProps, show: showDialog } = useFeedbackDialog();
  const toggleSection = (key: string) => setSections((p) => ({ ...p, [key]: !p[key] }));

  // Seed once — `initial` is a new object every time any form on the visit
  // saves (the whole visit refetches), and re-seeding would wipe in-progress
  // edits here. Same approach as PatientAssessmentForm.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initial || initializedRef.current) return;
    setData(initial);
    initializedRef.current = true;
  }, [initial]);

  const clearError = (key: string) => setErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));

  const setTop = (key: string, value: unknown) => {
    clearError(key);
    setData((prev) => ({ ...prev, [key]: value }));
  };
  const setIn = (section: Section, key: string, value: unknown) =>
    setData((prev) => ({ ...prev, [section]: { ...(prev[section] ?? {}), [key]: value } }));
  const a = (key: string) => str(data.assessment[key]);
  const setA = (key: string) => (v: unknown) => setIn("assessment", key, v);
  const msh = data.medical_surgical_history;

  const mentalStatus: string[] = Array.isArray(data.assessment.mental_status) ? data.assessment.mental_status : [];
  const toggleMentalStatus = (value: string, checked: boolean) =>
    setIn("assessment", "mental_status", checked ? [...mentalStatus, value] : mentalStatus.filter((v) => v !== value));

  const icdCodes: string[] = Array.isArray(msh.icd_code) ? msh.icd_code : [];

  // ─── Per-card "Clear All" (same as the web form) ───────────────────────
  const clearDiagnosis = () => setIn("medical_surgical_history", "icd_code", []);
  const clearHistory = () => setData((prev) => ({ ...prev, history: {} }));
  const clearPhysicalExam = () =>
    setData((prev) => {
      const nextMsh = { ...prev.medical_surgical_history };
      PHYSICAL_EXAM_CONTRAPTION_KEYS.forEach((k) => delete nextMsh[k]);
      return { ...prev, assessment: {}, medical_surgical_history: nextMsh, impression_and_plan: null };
    });

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newErrors: Record<string, boolean> = {
      initial_assessment: !data.initial_assessment,
      date_performed: !data.date_performed,
      assessment_signature: !data.assessment_signature_signed_at,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (newErrors.assessment_signature) setSections((prev) => ({ ...prev, signOff: true }));
      showDialog({
        variant: "error",
        title: "Missing Required Fields",
        message: "Please fix the fields highlighted in red below before saving.",
      });
      return;
    }
    onSave(data);
  };

  // ─── Section completion pills ──────────────────────────────────────────
  const countFilled = (values: unknown[]) =>
    values.filter((v) => (Array.isArray(v) ? v.length > 0 : v !== "" && v != null)).length;

  const historyValues = HISTORY_FIELDS.map((f) => data.history[f.key]);
  const physicalKeys = [
    "patient_alert", "caregiver", "bp_sys", "bp_dias", "temp", "spo2", "respiratory_rate", "pulse_rate",
    "pain_score", "location", "duration", "type_of_pain", "ambulatory_status", "distance", "device",
    "lung_ausculation", "oxygen_use_text", "oxygen_use_radio", "lit_per_minute", "height", "weight",
    "weight_loss", "weight_loss_amount", "appetite", "diet", "physical_examination",
  ];
  const physicalValues = [
    mentalStatus, ...physicalKeys.map((k) => data.assessment[k]),
    msh.contraptions_equipment_g1, msh.contraptions_equipment_g2, data.impression_and_plan,
  ];
  const signOffValues = [data.history_given_by, data.relationship_to_patient, data.assessment_signature_signed_at, data.designation];

  const accProps = { done: false, colors, isReadOnly, style: { marginBottom: 0 } };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("patientAssessmentNewTitle")}
        icon="clipboard"
        iconColor="#0D9488"
        badges={isReadOnly ? [{ text: t("readOnly"), bg: colors.borderLight, fg: colors.textSecondary }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody open={open} style={{ padding: 14, gap: 10 }} pointerEvents={isReadOnly ? "none" : "auto"}>
        {/* ─── Allergy / Date Performed / Assessment type ──────────────── */}
        <View style={{ gap: 10 }}>
          <TextField label="Allergy :" labelColor="#EF4444" value={str(data.allergy)} onChangeText={(v) => setTop("allergy", v)} colors={colors} multiline />
          <View>
            <Text style={[s.formLabel, { color: colors.text }]}>Date Performed:</Text>
            <DateTimeField
              mode="date"
              value={str(data.date_performed)}
              onChange={(v) => setTop("date_performed", v)}
              colors={colors}
              style={errors.date_performed ? { borderColor: "#EF4444", borderWidth: 1.5 } : undefined}
            />
            {errors.date_performed ? (
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#EF4444", marginTop: 3 }}>Required</Text>
            ) : null}
          </View>
          <RadioGroup
            options={ASSESSMENT_TYPE}
            value={str(data.initial_assessment)}
            onChange={(v) => setTop("initial_assessment", v)}
            colors={colors}
            disabled={isReadOnly}
            error={errors.initial_assessment}
          />
        </View>

        {/* ─── Final Diagnosis ─────────────────────────────────────────── */}
        <Acc title="Final Diagnosis" color="#F59E0B" isOpen={!!sections.diagnosis} onToggle={() => toggleSection("diagnosis")} filled={icdCodes.length ? 1 : 0} total={1} {...accProps}>
          <View style={{ gap: 10 }}>
            <ClearAllButton onPress={clearDiagnosis} disabled={isReadOnly} />
            <IcdCodePicker
              label="ICD Code:"
              value={icdCodes}
              onChange={(codes) => setIn("medical_surgical_history", "icd_code", codes)}
              colors={colors}
              disabled={isReadOnly}
            />
          </View>
        </Acc>

        {/* ─── History ─────────────────────────────────────────────────── */}
        <Acc title="History" color="#0EA5E9" isOpen={!!sections.history} onToggle={() => toggleSection("history")} filled={countFilled(historyValues)} total={historyValues.length} {...accProps}>
          <View style={{ gap: 10 }}>
            <ClearAllButton onPress={clearHistory} disabled={isReadOnly} />
            {HISTORY_FIELDS.map(({ key, label }) => (
              <TextField key={key} label={`${label}:`} value={str(data.history[key])} onChangeText={(v) => setIn("history", key, v)} colors={colors} multiline />
            ))}
          </View>
        </Acc>

        {/* ─── Physical examination ────────────────────────────────────── */}
        <Acc title="Physical examination" color="#0891B2" isOpen={!!sections.physical} onToggle={() => toggleSection("physical")} filled={countFilled(physicalValues)} total={physicalValues.length} {...accProps}>
          <View style={{ gap: 14 }}>
            <ClearAllButton onPress={clearPhysicalExam} disabled={isReadOnly} />

            <View style={{ gap: 4 }}>
              <Text style={[s.formLabel, { color: colors.text }]}>Mental Status:</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {MENTAL_STATUS_OPTIONS.map((opt) => (
                  <View key={opt.value} style={{ width: "45%" }}>
                    <CheckboxField
                      label={opt.label}
                      value={mentalStatus.includes(opt.value)}
                      onChange={(v) => toggleMentalStatus(opt.value, v)}
                      disabled={isReadOnly}
                    />
                  </View>
                ))}
              </View>
              {mentalStatus.includes("other") ? (
                <TextField label="Others" value={a("mental_status_other")} onChangeText={setA("mental_status_other")} colors={colors} />
              ) : null}
            </View>
            <RadioGroup label="Is Patient Alert?" options={PATIENT_ALERT} value={a("patient_alert")} onChange={setA("patient_alert")} colors={colors} disabled={isReadOnly} />
            <RadioGroup label="Can Patient Direct Caregiver?" options={YES_NO} value={a("caregiver")} onChange={setA("caregiver")} colors={colors} disabled={isReadOnly} />

            <Divider colors={colors} />
            <View style={{ gap: 10 }}>
              <SubTitle>VITAL SIGNS:</SubTitle>
              <View>
                <Text style={[s.formLabel, { color: colors.text }]}>Blood Pressure:</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TextField label="" value={a("bp_sys")} onChangeText={setA("bp_sys")} colors={colors} numeric minWidth="30%" />
                  <Text style={{ fontSize: 16, color: colors.textSecondary }}>/</Text>
                  <TextField label="" value={a("bp_dias")} onChangeText={setA("bp_dias")} colors={colors} numeric unit="mmHg" minWidth="30%" />
                </View>
              </View>
              <View style={s.formRow}>
                <TextField label="Temperature:" value={a("temp")} onChangeText={setA("temp")} colors={colors} numeric unit="°C" />
                <TextField label="SpO2:" value={a("spo2")} onChangeText={setA("spo2")} colors={colors} numeric unit="%" />
              </View>
              <View style={s.formRow}>
                <TextField label="Respiratory Rate:" value={a("respiratory_rate")} onChangeText={setA("respiratory_rate")} colors={colors} numeric unit="cycles per min" />
                <TextField label="Pulse Rate:" value={a("pulse_rate")} onChangeText={setA("pulse_rate")} colors={colors} unit="beats per min" />
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <SubTitle>Pain Assessment:</SubTitle>
              <View style={s.formRow}>
                <TextField label="Pain Score:" value={a("pain_score")} onChangeText={setA("pain_score")} colors={colors} numeric />
                <TextField label="Location :" value={a("location")} onChangeText={setA("location")} colors={colors} />
              </View>
              <View style={s.formRow}>
                <TextField label="Duration:" value={a("duration")} onChangeText={setA("duration")} colors={colors} />
                <TextField label="Type Of Pain:" value={a("type_of_pain")} onChangeText={setA("type_of_pain")} colors={colors} />
              </View>
            </View>

            <Divider colors={colors} />
            <TextField label="AMBULATORY STATUS:" value={a("ambulatory_status")} onChangeText={setA("ambulatory_status")} colors={colors} />
            <View style={s.formRow}>
              <TextField label="Distance" value={a("distance")} onChangeText={setA("distance")} colors={colors} />
              <TextField label="Device" value={a("device")} onChangeText={setA("device")} colors={colors} />
            </View>

            <Divider colors={colors} />
            <TextField label="LUNG AUSCULTATION:" value={a("lung_ausculation")} onChangeText={setA("lung_ausculation")} colors={colors} />
            <TextField label="OXYGEN USE:" value={a("oxygen_use_text")} onChangeText={setA("oxygen_use_text")} colors={colors} />
            <RadioGroup options={YES_NO} value={a("oxygen_use_radio")} onChange={setA("oxygen_use_radio")} colors={colors} disabled={isReadOnly} />
            <TextField label="Liters Per Minute:" value={a("lit_per_minute")} onChangeText={setA("lit_per_minute")} colors={colors} />

            <Divider colors={colors} />
            <View style={s.formRow}>
              <TextField label="Height (Cm):" value={a("height")} onChangeText={setA("height")} colors={colors} numeric />
              <TextField label="Weight (Kg):" value={a("weight")} onChangeText={setA("weight")} colors={colors} numeric />
            </View>
            <RadioGroup label="Recent Significant Weight Loss?" options={YES_NO} value={a("weight_loss")} onChange={setA("weight_loss")} colors={colors} disabled={isReadOnly} />
            <TextField label="If YES, How Much:" value={a("weight_loss_amount")} onChangeText={setA("weight_loss_amount")} colors={colors} />
            <View style={s.formRow}>
              <TextField label="APPETITE:" value={a("appetite")} onChangeText={setA("appetite")} colors={colors} numeric />
              <TextField label="DIET:" value={a("diet")} onChangeText={setA("diet")} colors={colors} numeric />
            </View>

            <Divider colors={colors} />
            <View style={{ gap: 8 }}>
              <Text style={[s.formLabel, { color: colors.text }]}>CURRENT CONTRAPTIONS AND/OR EQUIPMENT USE:</Text>
              <RadioGroup
                options={CONTRAPTIONS_G1}
                value={str(msh.contraptions_equipment_g1)}
                onChange={(v) => setIn("medical_surgical_history", "contraptions_equipment_g1", v)}
                colors={colors}
                disabled={isReadOnly}
                columns={2}
              />
              {msh.contraptions_equipment_g1 === "Assistive" ? (
                <TextField
                  label="Assistive Device"
                  value={str(msh.contraptions_equipment_g1_assistive)}
                  onChangeText={(v) => setIn("medical_surgical_history", "contraptions_equipment_g1_assistive", v)}
                  colors={colors}
                />
              ) : null}
              <Divider colors={colors} />
              <RadioGroup
                options={CONTRAPTIONS_G2}
                value={str(msh.contraptions_equipment_g2)}
                onChange={(v) => setIn("medical_surgical_history", "contraptions_equipment_g2", v)}
                colors={colors}
                disabled={isReadOnly}
                columns={2}
              />
              {msh.contraptions_equipment_g2 === CONTRAPTIONS_G2_OTHERS ? (
                <TextField
                  label="Others"
                  value={str(msh.contraptions_equipment_g2_others)}
                  onChangeText={(v) => setIn("medical_surgical_history", "contraptions_equipment_g2_others", v)}
                  colors={colors}
                />
              ) : null}
            </View>

            <Divider colors={colors} />
            <TextField label="Physical Examination:" placeholder="Physical examination" value={a("physical_examination")} onChangeText={setA("physical_examination")} colors={colors} multiline />
            <Divider colors={colors} />
            <TextField label="Impression And Plan:" placeholder="Impression and Plan" value={str(data.impression_and_plan)} onChangeText={(v) => setTop("impression_and_plan", v)} colors={colors} multiline />
          </View>
        </Acc>

        {/* ─── History given by / Sign-off ─────────────────────────────── */}
        <Acc title="Assessment Performed By" color="#3B82F6" isOpen={!!sections.signOff} onToggle={() => toggleSection("signOff")} filled={countFilled(signOffValues)} total={signOffValues.length} hasError={errors.assessment_signature} {...accProps}>
          <View style={{ gap: 12 }}>
            <TextField label="HISTORY GIVEN BY:" value={str(data.history_given_by)} onChangeText={(v) => setTop("history_given_by", v)} colors={colors} />
            <TextField label="RELATIONSHIP TO PATIENT:" value={str(data.relationship_to_patient)} onChangeText={(v) => setTop("relationship_to_patient", v)} colors={colors} />
            <Divider colors={colors} />
            <AttestField
              label="ASSESSMENT PERFORMED BY:"
              tapLabel="Click to Sign"
              value={{ signedAt: data.assessment_signature_signed_at, signedBy: data.assessment_signature_signed_by }}
              onChange={(v) => {
                clearError("assessment_signature");
                setData((prev) => ({ ...prev, assessment_signature_signed_at: v.signedAt ?? null, assessment_signature_signed_by: v.signedBy ?? null }));
              }}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              error={errors.assessment_signature}
              colors={colors}
              disabled={isReadOnly}
            />
            <TextField label="DESIGNATION:" value={str(data.designation)} onChangeText={(v) => setTop("designation", v)} colors={colors} />
          </View>
        </Acc>

        {!isReadOnly && (
          <Pressable style={[s.saveFlowBtn, { backgroundColor: !isSaving ? Colors.primary : colors.border }]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="save" size={16} color="#fff" />}
            <Text style={s.mainBtnText}>{isSaving ? t("saving") : t("save")}</Text>
          </Pressable>
        )}
      </CollapsibleBody>
      <FeedbackDialog {...dialogProps} />
    </Card>
  );
}
