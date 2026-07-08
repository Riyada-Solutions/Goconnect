import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { AttestField } from "@/components/ui/AttestField";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import { SelectField } from "@/components/ui/SelectField";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface SurgicalHistoryRow {
  performed_date: string;
  performed_place: string;
  surgical_history: string;
}

/**
 * The wire body is a large, loosely-structured object (see BACKEND_API §9 /
 * `patient-assessment`, cross-checked against the live web form's Livewire
 * bindings). Rather than modelling every nested key with a typed interface,
 * we keep the top-level flat fields + a handful of named nested objects as
 * `Record<string, any>` and round-trip them as-is — this mirrors exactly
 * what the server stores and avoids a lossy translation layer for a
 * ~100-field clinical form. Values are either strings (text/select) or
 * string arrays (checkbox groups, e.g. `cardio: ["wnl", "edema"]`).
 */
export interface PatientAssessmentData {
  flat: Record<string, any>;
  assessment: Record<string, any>;
  referral: { social_worker: boolean; disaster_planning: boolean; allied_health_professionals: boolean };
  social_hostory: Record<string, any>;
  patient_information: Record<string, string>;
  medical_surgical_history: Record<string, any>;
  surgical_history: SurgicalHistoryRow[];
  assessment_signature_signed_at: string | null;
  assessment_signature_signed_by: string | number | null;
}

export const EMPTY_PATIENT_ASSESSMENT: PatientAssessmentData = {
  flat: {},
  assessment: {},
  referral: { social_worker: false, disaster_planning: false, allied_health_professionals: false },
  social_hostory: {},
  patient_information: {},
  medical_surgical_history: {},
  surgical_history: [],
  assessment_signature_signed_at: null,
  assessment_signature_signed_by: null,
};

type Opt = { value: string; label: string };

const YES_NO: Opt[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
const GOOD_NOT_GOOD: Opt[] = [
  { value: "good", label: "Good" },
  { value: "notGood", label: "Not Good" },
];
const ADL: Opt[] = [
  { value: "ind", label: "Independent" },
  { value: "pa", label: "Partial Assist" },
  { value: "ta", label: "Total Assist" },
];

// ─── Clinical exam categories ───────────────────────────────────────────────
// Confirmed via a live wire capture of the web form's POST body: each of
// these keys is submitted as a single string (e.g. `"eyes": "wnl"`), not an
// array — the UI shows radio-style single-select circles, not checkboxes.
const CLINICAL_EXAM_GROUPS: { key: string; otherKey?: string; label: string; options: Opt[] }[] = [
  {
    key: "integumentary", otherKey: "integumentary_other", label: "Integumentary / Skin",
    options: [
      { value: "wnl", label: "WNL" }, { value: "rash", label: "Rash/Itching/Jaundiced" },
      { value: "lesions", label: "Lesions/Growth" }, { value: "scars", label: "Scars/Bruises" },
      { value: "decubitus", label: "Decubitus/Sores" }, { value: "breaks", label: "Breaks/Wound" },
      { value: "turgor", label: "Turgor (poor/fair/good)" }, { value: "temp", label: "Temp (Warm/Cold)" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "eyes", otherKey: "eyes_other", label: "Eyes",
    options: [
      { value: "wnl", label: "WNL" }, { value: "blurring", label: "Blurring/Watering/Itching" },
      { value: "glaucoma", label: "Glaucoma/Cataracts" }, { value: "glasses", label: "Glasses/Contacts" },
      { value: "eyeDrops", label: "Use of Eye Drops" }, { value: "other", label: "Other" },
    ],
  },
  {
    key: "ear", otherKey: undefined, label: "Ear",
    options: [
      { value: "wnl", label: "WNL" }, { value: "failure", label: "Hearing Failure R/L" },
      { value: "hearing_aid", label: "Hearing Aid" }, { value: "earaches", label: "Earaches/Ringing" },
    ],
  },
  {
    key: "nose", otherKey: undefined, label: "Nose",
    options: [{ value: "wnl", label: "WNL" }, { value: "congestion", label: "Congestion/Drainage" }],
  },
  {
    key: "cardio", otherKey: "cardio_other", label: "Cardiovascular",
    options: [
      { value: "wnl", label: "WNL" }, { value: "chf", label: "CHF/ASHD/CVA/TIA/Stroke" },
      { value: "hypertension", label: "Hypertension/Hypotension" }, { value: "chest_pain", label: "Chest Pain/NTG use/MI" },
      { value: "edema", label: "Edema" }, { value: "palpitations", label: "Palpitations/Arrhythmias" },
      { value: "pacemaker", label: "Pacemaker" }, { value: "other", label: "Other" },
    ],
  },
  {
    key: "endocrine", otherKey: "endocrine_other", label: "Endocrine",
    options: [
      { value: "wnl", label: "WNL" }, { value: "diet_controlled", label: "Diet Controlled" },
      { value: "diabetes", label: "Diabetes/Insulin Dependent" }, { value: "overweight", label: "Overweight/Underweight" },
      { value: "thyroid", label: "Thyroid Problems" }, { value: "other", label: "Other" },
    ],
  },
  {
    key: "peripheral", otherKey: "peripheral_other", label: "Peripheral",
    options: [
      { value: "wnl", label: "WNL" }, { value: "ulceration", label: "Ulceration" },
      { value: "swelling", label: "Swelling/Redness/Tingling" }, { value: "pedal_pulse", label: "Pedal Pulse Absent/Present" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "reproductive", otherKey: "reproductive_other", label: "Reproductive",
    options: [
      { value: "wnl", label: "WNL" }, { value: "breast", label: "Breast — Mastectomy/Lumps/Pain/Tenderness/Discharge" },
      { value: "vaginal_discharge", label: "Vaginal Discharge/Lesions" }, { value: "pain", label: "Pain" },
      { value: "menstruation", label: "Menstruation — Reg/Irreg/Meno" }, { value: "other", label: "Other" },
    ],
  },
  {
    key: "genitourinary", otherKey: "genitourinary_other", label: "Genitourinary",
    options: [
      { value: "wnl", label: "WNL" }, { value: "uti", label: "UTI/Frequent Infections" },
      { value: "frequency", label: "Frequency/Urgency/Nocturia" }, { value: "dysuria", label: "Dysuria/Hematuria" },
      { value: "burning", label: "Burning/Dribbling" }, { value: "incontinence", label: "Incontinence/Catheter" },
      { value: "other", label: "Other" },
    ],
  },
];

const MENTAL_STATUS_OPTIONS: Opt[] = [
  { value: "oriented", label: "Oriented" }, { value: "forgetful", label: "Forgetful" },
  { value: "disoriented", label: "Disoriented" }, { value: "comatose", label: "Comatose" },
  { value: "agitated", label: "Agitated" }, { value: "depressed", label: "Depressed" },
  { value: "lethargic", label: "Lethargic" }, { value: "other", label: "Other" },
];

// ─── Physical assessment — select fields (confirmed enum values) ──────────
const PHYSICAL_SELECT_FIELDS: { key: string; label: string; options: Opt[] }[] = [
  { key: "reactive_to_light", label: "Reactive to Light", options: YES_NO },
  { key: "follow_finger", label: "Follows Finger", options: YES_NO },
  { key: "sclera", label: "Sclera", options: GOOD_NOT_GOOD },
  { key: "ear_discharge", label: "Ear Discharge", options: YES_NO },
  { key: "mucousMembrane", label: "Mucous Membrane", options: GOOD_NOT_GOOD },
  { key: "teeth", label: "Teeth", options: GOOD_NOT_GOOD },
  { key: "swallowing", label: "Swallowing", options: GOOD_NOT_GOOD },
  { key: "odor", label: "Odor", options: YES_NO },
  { key: "tongue", label: "Tongue", options: [{ value: "pink", label: "Pink" }, { value: "pale", label: "Pale" }, { value: "other", label: "Other" }] },
  { key: "heartSounds", label: "Heart Sounds", options: GOOD_NOT_GOOD },
  { key: "capillaryRefill", label: "Capillary Refill", options: [{ value: "lessThan3", label: "≤ 3 secs" }, { value: "moreThan3", label: "≥ 3 secs" }] },
  { key: "temperature", label: "Temperature", options: [{ value: "warm", label: "Warm" }, { value: "cold", label: "Cold" }] },
];

const PHYSICAL_TEXT_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "throat_dental_other", label: "Dentures (Specify)" },
  { key: "swollen", label: "Swollen" },
  { key: "allergy", label: "Allergy", multiline: true },
];

// ─── Environmental Hazards / Safety Checklist — all confirmed Yes/No ──────
const ENVIRONMENTAL_FIELDS: { key: string; label: string }[] = [
  { key: "working_telephone", label: "Working Telephone" },
  { key: "smoke_alarms", label: "Functional Smoke Alarms" },
  { key: "pathways", label: "Pathways Level, Clear" },
  { key: "meds_safety", label: "Meds Safety — Stored/Labeled" },
  { key: "environment_safety", label: "Overall Environment Safety" },
  { key: "emergency", label: "Emergency Nos. Available" },
  { key: "fire_extinguisher", label: "Fire Extinguisher Present" },
  { key: "stairs_handrail", label: "Stairs / Handrail Non-Skid" },
  { key: "bathroom_safety", label: "Bathroom Safe/Adequate" },
  { key: "elevator", label: "Elevator in the Building" },
  { key: "cords", label: "Electrical Cords/Outlets Safe" },
  { key: "exit", label: "Exit Areas Clear, Lighted" },
  { key: "lighting", label: "Adequate Lighting" },
  { key: "kitchen", label: "Kitchen Safe, Functional" },
  { key: "adaptive", label: "Adaptive Equipment" },
];

// ─── Activities of Daily Living — IND / PA / TA ────────────────────────────
const ADL_FIELDS: { key: string; label: string }[] = [
  { key: "bathing", label: "Bathing/Showering" },
  { key: "toileting", label: "Toileting / Bathroom" },
  { key: "transfers_commode", label: "Transfers — Commode / Wheelchair" },
  { key: "grooming", label: "Grooming" },
  { key: "meal_preparation", label: "Meal Preparation" },
  { key: "house_works", label: "House Works" },
  { key: "eating", label: "Eating" },
  { key: "dressing", label: "Dressing" },
  { key: "grooming_second", label: "Grooming (2)" },
];

const MISC_FIELDS: { key: string; label: string }[] = [
  { key: "designation", label: "Designation" },
  { key: "history_given_by", label: "History Given By" },
  { key: "relationship_to_patient", label: "Relationship to Patient" },
];

const ACTION_PLANNED_FIELD = { key: "action_planned", label: "Action Planned" };

const ASSESSMENT_SELECT_FIELDS: { key: string; label: string; options: Opt[] }[] = [
  { key: "patient_alert", label: "Is Patient Alert?", options: [{ value: "Always", label: "Always" }, { value: "Sometimes", label: "Sometimes" }, { value: "Never", label: "Never" }] },
  { key: "caregiver", label: "Can Patient Direct Caregiver?", options: YES_NO },
  { key: "weight_loss", label: "Recent Significant Weight Loss?", options: YES_NO },
  { key: "oxygen_use_radio", label: "Oxygen Use?", options: YES_NO },
];

const ASSESSMENT_TEXT_FIELDS: { key: string; label: string }[] = [
  { key: "height", label: "Height (Cm)" },
  { key: "weight", label: "Weight (Kg)" },
  { key: "bp_sys", label: "BP Systolic" },
  { key: "bp_dias", label: "BP Diastolic" },
  { key: "pulse_rate", label: "Pulse Rate (beats/min)" },
  { key: "respiratory_rate", label: "Respiratory Rate (cycles/min)" },
  { key: "temp", label: "Temperature (°C)" },
  { key: "spo2", label: "SpO2 (%)" },
  { key: "pain_score", label: "Pain Score" },
  { key: "diet", label: "Diet" },
  { key: "device", label: "Device" },
  { key: "appetite", label: "Appetite" },
  { key: "distance", label: "Distance" },
  { key: "duration", label: "Duration" },
  { key: "location", label: "Pain Location" },
  { key: "weight_loss_amount", label: "Weight Loss Amount (If Yes, How Much)" },
  { key: "type_of_pain", label: "Type of Pain" },
  { key: "lit_per_minute", label: "Liters per Minute" },
  { key: "lung_ausculation", label: "Lung Auscultation" },
  { key: "oxygen_use_text", label: "Oxygen Use — Notes" },
  { key: "ambulatory_status", label: "Ambulatory Status" },
];

const SOCIAL_HISTORY_SELECT_FIELDS: { key: string; label: string; options: Opt[] }[] = [
  { key: "livingSituation", label: "Lives Alone?", options: YES_NO },
  { key: "dwellingType", label: "Type of Dwelling", options: [{ value: "flat", label: "Flat" }, { value: "house", label: "House" }, { value: "villa", label: "Villa" }, { value: "other", label: "Other" }] },
  { key: "Elevator", label: "Elevator", options: YES_NO },
  { key: "caregiver_recieve_instruction", label: "Caregiver Able to Receive Instruction / Provide Care?", options: [...YES_NO, { value: "na", label: "N/A" }] },
];

const SOCIAL_HISTORY_TEXT_FIELDS: { key: string; label: string }[] = [
  { key: "floor", label: "Floor" },
  { key: "room", label: "Rooms" },
  { key: "dwellingTypeOther", label: "Dwelling Type — Other" },
  { key: "primary_caregiver", label: "Primary Caregiver" },
  { key: "ava_assist_patient", label: "Availability to Assist Patient" },
  { key: "pr_pa_lang", label: "Language (Patient) — Primary" },
  { key: "sec_pa_lang", label: "Language (Patient) — Secondary" },
  { key: "religion", label: "Religion" },
  { key: "pr_fam_lang", label: "Language (Family) — Primary" },
  { key: "sec_fam_lang", label: "Language (Family) — Secondary" },
  { key: "hobbies", label: "Interests / Hobbies" },
  { key: "pa_occ_history", label: "Patient Occupational History" },
  { key: "indiv_with_patient", label: "Individuals Living With the Patient" },
];

const PATIENT_INFO_FIELDS: { key: string; label: string }[] = [
  { key: "contanct_no", label: "Contact Number" },
  { key: "emergancy_contact_person", label: "Emergency Contact Person" },
];

const MEDICAL_HISTORY_TEXT_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "medical_history", label: "Medical History", multiline: true },
  { key: "icd_code", label: "ICD Code" },
  { key: "mother_medical_history", label: "Mother's Medical History" },
  { key: "father_medical_history", label: "Father's Medical History" },
  { key: "medication_history", label: "Medication History", multiline: true },
];

// Confirmed via the web PDF export ("CURRENT CONTRAPTIONS AND/OR EQUIPMENT USE").
const CONTRAPTIONS_OPTIONS: Opt[] = [
  { value: "iv", label: "IV" }, { value: "feeding_pump", label: "Feeding Pump" },
  { value: "ventilator", label: "Ventilator" }, { value: "oxygen", label: "Oxygen" },
  { value: "iv_pump", label: "IV Pump" }, { value: "assistive_device", label: "Assistive Device" },
  { value: "catheter", label: "Catheter" }, { value: "feeding_tube", label: "Feeding Tube" },
  { value: "nebulizer", label: "Nebulizer" }, { value: "bipap_cpap", label: "BiPAP/CPAP" },
  { value: "drains", label: "Drains" }, { value: "other", label: "Others" },
];

const REFERRAL_FLAGS: { key: keyof PatientAssessmentData["referral"]; label: string }[] = [
  { key: "disaster_planning", label: "Disaster Planning" },
  { key: "social_worker", label: "Social Worker" },
  { key: "allied_health_professionals", label: "Allied Health Professionals (Nutritionist/Dietitian, Physiotherapy, Respiratory Therapists, other)" },
];

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: PatientAssessmentData | null;
  isSaving?: boolean;
  onSave: (data: PatientAssessmentData) => void;
  currentUserId: string | number;
  currentUserName?: string;
  t: (key: any) => string;
}

function TextField({
  fkey, label, value, onChangeText, colors, multiline,
}: { fkey: string; label: string; value: string; onChangeText: (v: string) => void; colors: any; multiline?: boolean }) {
  return (
    <View key={fkey} style={{ flex: 1, minWidth: "45%" }}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          s.formInput,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, minHeight: multiline ? 70 : undefined, textAlignVertical: multiline ? "top" : "center" },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
      />
    </View>
  );
}

function SelectRow({
  fkey, label, value, options, onChange,
}: { fkey: string; label: string; value: string; options: Opt[]; onChange: (v: string) => void }) {
  return (
    <View key={fkey} style={{ flex: 1, minWidth: "45%" }}>
      <SelectField label={label} value={value || null} options={options} placeholder="Select" onChange={onChange} />
    </View>
  );
}

function TextGrid({
  title, fields, values, onChange, colors,
}: { title?: string; fields: { key: string; label: string; multiline?: boolean }[]; values: Record<string, any>; onChange: (key: string, value: string) => void; colors: any }) {
  return (
    <View style={{ gap: 10 }}>
      {title ? <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>{title}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {fields.map(({ key, label, multiline }) => (
          <TextField key={key} fkey={key} label={label} value={String(values[key] ?? "")} onChangeText={(v) => onChange(key, v)} colors={colors} multiline={multiline} />
        ))}
      </View>
    </View>
  );
}

function SelectGrid({
  title, fields, values, onChange,
}: { title?: string; fields: { key: string; label: string; options: Opt[] }[]; values: Record<string, any>; onChange: (key: string, value: string) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {title ? <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>{title}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {fields.map(({ key, label, options }) => (
          <SelectRow key={key} fkey={key} label={label} value={String(values[key] ?? "")} options={options} onChange={(v) => onChange(key, v)} />
        ))}
      </View>
    </View>
  );
}

function ClinicalExamSelect({
  group, value, otherValue, onChange, onOtherChange, colors,
}: {
  group: { key: string; otherKey?: string; label: string; options: Opt[] };
  value: string;
  otherValue: string;
  onChange: (v: string) => void;
  onOtherChange: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={{ gap: 4, minWidth: "45%", flex: 1 }}>
      <SelectField label={group.label} value={value || null} options={group.options} placeholder="Select" onChange={onChange} />
      {group.otherKey && value === "other" ? (
        <TextInput
          style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, marginTop: 4 }]}
          value={otherValue}
          onChangeText={onOtherChange}
          placeholder={`${group.label} — Other`}
          placeholderTextColor={colors.textTertiary}
        />
      ) : null}
    </View>
  );
}

export function PatientAssessmentForm({
  colors, isReadOnly, initialExpanded, initial, isSaving = false, onSave, currentUserId, currentUserName, t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<PatientAssessmentData>(() => initial ?? { ...EMPTY_PATIENT_ASSESSMENT });
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  useEffect(() => {
    if (!initial) return;
    setData(initial);
  }, [initial]);

  const updateFlat = (key: string, value: string) =>
    setData((prev) => ({ ...prev, flat: { ...prev.flat, [key]: value } }));
  const updateAssessment = (key: string, value: string) =>
    setData((prev) => ({ ...prev, assessment: { ...prev.assessment, [key]: value } }));
  const toggleMentalStatus = (value: string, checked: boolean) =>
    setData((prev) => {
      const current: string[] = Array.isArray(prev.assessment.mental_status) ? prev.assessment.mental_status : [];
      const next = checked ? [...current, value] : current.filter((v) => v !== value);
      return { ...prev, assessment: { ...prev.assessment, mental_status: next } };
    });
  const updateSocialHistory = (key: string, value: string) =>
    setData((prev) => ({ ...prev, social_hostory: { ...prev.social_hostory, [key]: value } }));
  const updatePatientInfo = (key: string, value: string) =>
    setData((prev) => ({ ...prev, patient_information: { ...prev.patient_information, [key]: value } }));
  const updateMedicalHistory = (key: string, value: string) =>
    setData((prev) => ({ ...prev, medical_surgical_history: { ...prev.medical_surgical_history, [key]: value } }));
  const toggleContraptions = (value: string, checked: boolean) =>
    setData((prev) => {
      const current: string[] = Array.isArray(prev.medical_surgical_history.contraptions_equipment_g1) ? prev.medical_surgical_history.contraptions_equipment_g1 : [];
      const next = checked ? [...current, value] : current.filter((v) => v !== value);
      return { ...prev, medical_surgical_history: { ...prev.medical_surgical_history, contraptions_equipment_g1: next } };
    });
  const toggleReferral = (key: keyof PatientAssessmentData["referral"], value: boolean) =>
    setData((prev) => ({ ...prev, referral: { ...prev.referral, [key]: value } }));

  const addSurgicalRow = () =>
    setData((prev) => ({ ...prev, surgical_history: [...prev.surgical_history, { performed_date: "", performed_place: "", surgical_history: "" }] }));
  const updateSurgicalRow = (index: number, patch: Partial<SurgicalHistoryRow>) =>
    setData((prev) => ({ ...prev, surgical_history: prev.surgical_history.map((row, i) => (i === index ? { ...row, ...patch } : row)) }));
  const removeSurgicalRow = (index: number) =>
    setData((prev) => ({ ...prev, surgical_history: prev.surgical_history.filter((_, i) => i !== index) }));

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const missing: string[] = [];
    if (!data.flat.initial_assessment) missing.push("Assessment Type (Initial / Re-Assessment)");
    if (!data.flat.date_performed) missing.push("Date Performed");
    if (!data.assessment_signature_signed_at) missing.push("Assessment Performed By (signature)");
    if (missing.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog({
        variant: "error",
        title: "Missing Required Fields",
        message: `Please complete the following before saving:\n${missing.map((m) => `• ${m}`).join("\n")}`,
      });
      return;
    }
    onSave(data);
  };
  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData({ ...EMPTY_PATIENT_ASSESSMENT });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("patientAssessmentTitle")}
        icon="activity"
        iconColor="#EA580C"
        badges={isReadOnly ? [{ text: t("readOnly"), bg: colors.borderLight, fg: colors.textSecondary }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody open={open} style={{ padding: 14, gap: 18 }} pointerEvents={isReadOnly ? "none" : "auto"}>
        <TextField fkey="allergy" label="Allergy" value={String(data.flat.allergy ?? "")} onChangeText={(v) => updateFlat("allergy", v)} colors={colors} multiline />

        <View style={s.formRow}>
          <SelectRow
            fkey="initial_assessment"
            label="Assessment Type"
            value={String(data.flat.initial_assessment ?? "")}
            options={[{ value: "initial", label: "Initial Assessment" }, { value: "reassessment", label: "Re-Assessment" }]}
            onChange={(v) => updateFlat("initial_assessment", v)}
          />
          <View style={{ flex: 1, minWidth: "45%" }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Date Performed</Text>
            <DateTimeField mode="date" value={String(data.flat.date_performed ?? "")} onChange={(v) => updateFlat("date_performed", v)} colors={colors} />
          </View>
        </View>

        {/* ─── Assessment: mental status, vitals, pain, nutrition ─────── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Mental Status</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {MENTAL_STATUS_OPTIONS.map((opt) => (
              <View key={opt.value} style={{ width: "45%" }}>
                <CheckboxField
                  label={opt.label}
                  value={(data.assessment.mental_status ?? []).includes(opt.value)}
                  onChange={(v) => toggleMentalStatus(opt.value, v)}
                  disabled={isReadOnly}
                />
              </View>
            ))}
          </View>
          <TextField
            fkey="mental_status_other"
            label="Mental Status — Other"
            value={String(data.assessment.mental_status_other ?? "")}
            onChangeText={(v) => updateAssessment("mental_status_other", v)}
            colors={colors}
          />
        </View>

        <SelectGrid fields={ASSESSMENT_SELECT_FIELDS} values={data.assessment} onChange={updateAssessment} />
        <TextGrid title="Vitals & Nutrition" fields={ASSESSMENT_TEXT_FIELDS} values={data.assessment} onChange={updateAssessment} colors={colors} />

        {/* ─── Physical Assessment ─────────────────────────────────────── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Physical Assessment</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {CLINICAL_EXAM_GROUPS.map((group) => (
              <ClinicalExamSelect
                key={group.key}
                group={group}
                value={String(data.flat[group.key] ?? "")}
                otherValue={group.otherKey ? String(data.flat[group.otherKey] ?? "") : ""}
                onChange={(v) => updateFlat(group.key, v)}
                onOtherChange={(v) => group.otherKey && updateFlat(group.otherKey, v)}
                colors={colors}
              />
            ))}
          </View>
        </View>
        <SelectGrid fields={PHYSICAL_SELECT_FIELDS} values={data.flat} onChange={updateFlat} />
        <CheckboxField
          label="Throat/Dental — WNL"
          value={!!data.flat.throatOption}
          onChange={(v) => setData((prev) => ({ ...prev, flat: { ...prev.flat, throatOption: v } }))}
          disabled={isReadOnly}
        />
        <TextGrid fields={PHYSICAL_TEXT_FIELDS} values={data.flat} onChange={updateFlat} colors={colors} />

        {/* ─── Medical History ─────────────────────────────────────────── */}
        <TextGrid title="Medical History" fields={MEDICAL_HISTORY_TEXT_FIELDS} values={data.medical_surgical_history} onChange={updateMedicalHistory} colors={colors} />
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Current Contraptions and/or Equipment Use</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {CONTRAPTIONS_OPTIONS.map((opt) => (
              <View key={opt.value} style={{ width: "45%" }}>
                <CheckboxField
                  label={opt.label}
                  value={(data.medical_surgical_history.contraptions_equipment_g1 ?? []).includes(opt.value)}
                  onChange={(v) => toggleContraptions(opt.value, v)}
                  disabled={isReadOnly}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ─── Surgical History ────────────────────────────────────────── */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Surgical History</Text>
            {!isReadOnly && (
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); addSurgicalRow(); }} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="plus-circle" size={16} color={Colors.primary} />
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary }}>Add</Text>
              </Pressable>
            )}
          </View>
          {data.surgical_history.map((row, idx) => (
            <View key={idx} style={{ gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card }}>
              <TextField fkey={`sh_desc_${idx}`} label="Surgical History" value={row.surgical_history} onChangeText={(v) => updateSurgicalRow(idx, { surgical_history: v })} colors={colors} />
              <View style={s.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.formLabel, { color: colors.text }]}>Date Surgery Performed</Text>
                  <DateTimeField mode="date" value={row.performed_date} onChange={(v) => updateSurgicalRow(idx, { performed_date: v })} colors={colors} />
                </View>
                <TextField fkey={`sh_place_${idx}`} label="Where?" value={row.performed_place} onChangeText={(v) => updateSurgicalRow(idx, { performed_place: v })} colors={colors} />
              </View>
              {!isReadOnly && (
                <Pressable onPress={() => removeSurgicalRow(idx)} style={{ alignSelf: "flex-end" }}>
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* ─── Social History ──────────────────────────────────────────── */}
        <SelectGrid title="Social History" fields={SOCIAL_HISTORY_SELECT_FIELDS} values={data.social_hostory} onChange={updateSocialHistory} />
        <TextGrid fields={SOCIAL_HISTORY_TEXT_FIELDS} values={data.social_hostory} onChange={updateSocialHistory} colors={colors} />
        <TextGrid title="Patient Information" fields={PATIENT_INFO_FIELDS} values={data.patient_information} onChange={updatePatientInfo} colors={colors} />

        {/* ─── Activities of Daily Living ──────────────────────────────── */}
        <SelectGrid title="Activities of Daily Living" fields={ADL_FIELDS.map((f) => ({ ...f, options: ADL }))} values={data.flat} onChange={updateFlat} />

        {/* ─── Environmental Hazards / Safety Checklist ───────────────── */}
        <SelectGrid title="Environmental Hazards / Safety Checklist" fields={ENVIRONMENTAL_FIELDS.map((f) => ({ ...f, options: YES_NO }))} values={data.flat} onChange={updateFlat} />
        <TextField fkey={ACTION_PLANNED_FIELD.key} label={ACTION_PLANNED_FIELD.label} value={String(data.flat[ACTION_PLANNED_FIELD.key] ?? "")} onChangeText={(v) => updateFlat(ACTION_PLANNED_FIELD.key, v)} colors={colors} multiline />

        {/* ─── Referral ────────────────────────────────────────────────── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Referral</Text>
          {REFERRAL_FLAGS.map(({ key, label }) => (
            <CheckboxField key={key} label={label} value={!!data.referral[key]} onChange={(v) => toggleReferral(key, v)} disabled={isReadOnly} />
          ))}
        </View>

        <TextGrid title="Assessor Details" fields={MISC_FIELDS} values={data.flat} onChange={updateFlat} colors={colors} />

        <AttestField
          label="Assessment Performed By"
          value={{ signedAt: data.assessment_signature_signed_at, signedBy: data.assessment_signature_signed_by }}
          onChange={(v) => setData((prev) => ({ ...prev, assessment_signature_signed_at: v.signedAt ?? null, assessment_signature_signed_by: v.signedBy ?? null }))}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          colors={colors}
          disabled={isReadOnly}
        />

        {!isReadOnly && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <Pressable style={[s.saveFlowBtn, { backgroundColor: !isSaving ? Colors.primary : colors.border, flex: 1 }]} onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="save" size={16} color="#fff" />}
              <Text style={s.mainBtnText}>{isSaving ? t("saving") : t("save")}</Text>
            </Pressable>
            <Pressable style={[s.saveFlowBtn, { backgroundColor: "#EF4444", flex: 1 }]} onPress={handleClear}>
              <Feather name="trash-2" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("clear")}</Text>
            </Pressable>
          </View>
        )}
      </CollapsibleBody>
      <FeedbackDialog {...dialogProps} />
    </Card>
  );
}
