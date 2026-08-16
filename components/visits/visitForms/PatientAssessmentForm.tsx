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
  { key: "mother_medical_history", label: "Mother's Medical History" },
  { key: "father_medical_history", label: "Father's Medical History" },
  { key: "medication_history", label: "Medication History", multiline: true },
];

// Confirmed via the live API payload ("CURRENT CONTRAPTIONS AND/OR EQUIPMENT USE") —
// two independent single-select radio rows, `contraptions_equipment_g1` / `_g2`.
// Wire values are exact-cased strings the backend sends/expects verbatim.
const CONTRAPTIONS_OPTIONS_G1: Opt[] = [
  { value: "IV", label: "IV" }, { value: "Feeding", label: "Feeding" },
  { value: "Ventilator", label: "Ventilator" }, { value: "Oxygen", label: "Oxygen" },
  { value: "Pump", label: "Pump" }, { value: "Assistive", label: "Assistive" },
];
const CONTRAPTIONS_OPTIONS_G2: Opt[] = [
  { value: "Drains", label: "Drains" }, { value: "BiPAP_CPAP", label: "BiPAP/CPAP" },
  { value: "Feeding_tube", label: "Feeding Tube" }, { value: "Catheter", label: "Catheter" },
  { value: "Nebulizer", label: "Nebulizer" }, { value: "Others", label: "Others" },
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
  /** Pre-Treatment BP from the Flow Sheet's Post Treatment Assessment
   *  (`bp_sitting_systolic` / `bp_sitting_diastolic`). BP Systolic/Diastolic
   *  here are read-only and mirror that value instead of being editable. */
  flowSheetBp?: { systolic?: string | null; diastolic?: string | null };
}

function TextField({
  fkey, label, value, onChangeText, colors, multiline, readOnly,
}: { fkey: string; label: string; value: string; onChangeText: (v: string) => void; colors: any; multiline?: boolean; readOnly?: boolean }) {
  return (
    <View key={fkey} style={{ flex: 1, minWidth: "45%" }}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          s.formInput,
          {
            color: readOnly ? colors.textSecondary : colors.text,
            backgroundColor: readOnly ? colors.borderLight : colors.surface,
            borderColor: colors.border,
            minHeight: multiline ? 70 : undefined,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        editable={!readOnly}
      />
    </View>
  );
}

function SelectRow({
  fkey, label, value, options, onChange, error,
}: { fkey: string; label: string; value: string; options: Opt[]; onChange: (v: string) => void; error?: string | boolean }) {
  return (
    <View key={fkey} style={{ flex: 1, minWidth: "45%" }}>
      <SelectField label={label} value={value || null} options={options} placeholder="Select" onChange={onChange} error={error} />
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

function RadioOption({
  label, selected, onPress, colors, disabled,
}: { label: string; selected: boolean; onPress: () => void; colors: any; disabled?: boolean }) {
  return (
    <Pressable
      onPress={() => !disabled && onPress()}
      style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, opacity: disabled ? 0.6 : 1 }}
    >
      <View
        style={{
          width: 20, height: 20, borderRadius: 10, borderWidth: 2,
          borderColor: selected ? Colors.primary : colors.border,
          alignItems: "center", justifyContent: "center",
        }}
      >
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary }} />}
      </View>
      <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.text }}>{label}</Text>
    </Pressable>
  );
}

function RadioRow({
  options, value, onChange, colors, disabled, vertical,
}: { options: Opt[]; value: string; onChange: (v: string) => void; colors: any; disabled?: boolean; vertical?: boolean }) {
  return (
    <View style={vertical ? { gap: 4 } : { flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {options.map((opt) => (
        <View key={opt.value} style={vertical ? undefined : { minWidth: 120, flexGrow: 1, flexBasis: "16%" }}>
          <RadioOption
            label={opt.label}
            selected={value === opt.value}
            onPress={() => onChange(opt.value)}
            colors={colors}
            disabled={disabled}
          />
        </View>
      ))}
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
  colors, isReadOnly, initialExpanded, initial, isSaving = false, onSave, currentUserId, currentUserName, t, flowSheetBp,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<PatientAssessmentData>(() => initial ?? { ...EMPTY_PATIENT_ASSESSMENT });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  // BP Systolic/Diastolic are read-only here — sourced from the Flow Sheet's
  // Post Treatment Assessment rather than entered on this form. Keep them
  // mirrored into `data.assessment` so the saved payload still carries them.
  const flowBpSys = flowSheetBp?.systolic ?? "";
  const flowBpDias = flowSheetBp?.diastolic ?? "";
  useEffect(() => {
    if (!flowSheetBp) return;
    setData((prev) => {
      if (prev.assessment.bp_sys === flowBpSys && prev.assessment.bp_dias === flowBpDias) return prev;
      return { ...prev, assessment: { ...prev.assessment, bp_sys: flowBpSys, bp_dias: flowBpDias } };
    });
  }, [flowBpSys, flowBpDias, flowSheetBp]);
  const [sections, setSections] = useState<Record<string, boolean>>(
    initialExpanded ? {
      assessment: true, physical: true, medicalHistory: true, surgicalHistory: true,
      socialHistory: true, adl: true, environmental: true, referral: true,
    } : {},
  );
  const toggleSection = (key: string) => setSections((p) => ({ ...p, [key]: !p[key] }));

  // Seed `data` from the server-parsed `initial` once the first real payload
  // arrives (it's `null` until the visit query resolves). Only ever do this
  // once per mount — `initial` is a fresh object reference every time ANY
  // section on the visit screen saves (the whole visit refetches), and
  // re-running this on every such change would silently wipe out whatever
  // the nurse is mid-typing here in favour of stale last-saved-from-server
  // data, which is how in-progress edits (e.g. the contraptions "Assistive"/
  // "Others" specify fields) were getting dropped before Save was pressed.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initial || initializedRef.current) return;
    setData(initial);
    initializedRef.current = true;
  }, [initial]);

  const clearError = (key: string) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));

  const updateFlat = (key: string, value: string) => {
    clearError(key);
    setData((prev) => ({ ...prev, flat: { ...prev.flat, [key]: value } }));
  };
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
    const newErrors: Record<string, boolean> = {
      initial_assessment: !data.flat.initial_assessment,
      date_performed: !data.flat.date_performed,
      assessment_signature: !data.assessment_signature_signed_at,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Expand any collapsed section that failed validation so its red
      // header icon (and the field itself) is visible without extra taps.
      if (newErrors.assessment_signature) setSections((prev) => ({ ...prev, referral: true }));
      showDialog({
        variant: "error",
        title: "Missing Required Fields",
        message: "Please fix the fields highlighted in red below before saving.",
      });
      return;
    }
    onSave(data);
  };

  // ─── Per-section completion pills (same "filled/total" treatment as the
  // Flow Sheet's Acc headers) ────────────────────────────────────────────
  const countFilled = (values: any[]) =>
    values.filter((v) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== "" && v !== undefined && v !== null && v !== false;
    }).length;
  const countRowsFilled = (rows: Record<string, any>[]) =>
    rows.filter((r) => Object.values(r).some((v) => v !== "" && v !== undefined && v !== null)).length;

  const assessmentFields = [
    data.assessment.mental_status, data.assessment.mental_status_other,
    ...ASSESSMENT_SELECT_FIELDS.map((f) => data.assessment[f.key]),
    data.assessment.bp_sys, data.assessment.bp_dias,
    ...ASSESSMENT_TEXT_FIELDS.map((f) => data.assessment[f.key]),
  ];
  const assessmentFilled = countFilled(assessmentFields);
  const assessmentTotal = assessmentFields.length;

  const physicalFields = [
    ...CLINICAL_EXAM_GROUPS.map((g) => data.flat[g.key]),
    ...PHYSICAL_SELECT_FIELDS.map((f) => data.flat[f.key]),
    data.flat.throatOption, data.flat.swollen, data.flat.dentures,
    ...PHYSICAL_TEXT_FIELDS.map((f) => data.flat[f.key]),
  ];
  const physicalFilled = countFilled(physicalFields);
  const physicalTotal = physicalFields.length;

  const medicalHistoryFields = [
    data.medical_surgical_history.medical_history, data.medical_surgical_history.icd_code,
    ...MEDICAL_HISTORY_TEXT_FIELDS.map((f) => data.medical_surgical_history[f.key]),
    data.medical_surgical_history.contraptions_equipment_g1,
    data.medical_surgical_history.contraptions_equipment_g2,
  ];
  const medicalHistoryFilled = countFilled(medicalHistoryFields);
  const medicalHistoryTotal = medicalHistoryFields.length;

  const surgicalHistoryFilled = countRowsFilled(data.surgical_history);
  const surgicalHistoryTotal = Math.max(data.surgical_history.length, 1);

  const socialHistoryFields = [
    ...SOCIAL_HISTORY_SELECT_FIELDS.map((f) => data.social_hostory[f.key]),
    ...SOCIAL_HISTORY_TEXT_FIELDS.map((f) => data.social_hostory[f.key]),
    ...PATIENT_INFO_FIELDS.map((f) => data.patient_information[f.key]),
  ];
  const socialHistoryFilled = countFilled(socialHistoryFields);
  const socialHistoryTotal = socialHistoryFields.length;

  const adlFields = ADL_FIELDS.map((f) => data.flat[f.key]);
  const adlFilled = countFilled(adlFields);
  const adlTotal = adlFields.length;

  const environmentalFields = [...ENVIRONMENTAL_FIELDS.map((f) => data.flat[f.key]), data.flat[ACTION_PLANNED_FIELD.key]];
  const environmentalFilled = countFilled(environmentalFields);
  const environmentalTotal = environmentalFields.length;

  const referralFields = [
    ...REFERRAL_FLAGS.map((f) => data.referral[f.key]),
    ...MISC_FIELDS.map((f) => data.flat[f.key]),
    data.assessment_signature_signed_at,
  ];
  const referralFilled = countFilled(referralFields);
  const referralTotal = referralFields.length;
  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData({ ...EMPTY_PATIENT_ASSESSMENT });
    setErrors({});
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
      <CollapsibleBody open={open} style={{ padding: 14, gap: 10 }} pointerEvents={isReadOnly ? "none" : "auto"}>
        <View style={{ gap: 10 }}>
          <TextField fkey="allergy" label="Allergy" value={String(data.flat.allergy ?? "")} onChangeText={(v) => updateFlat("allergy", v)} colors={colors} multiline />

          <View style={s.formRow}>
            <SelectRow
              fkey="initial_assessment"
              label="Assessment Type"
              value={String(data.flat.initial_assessment ?? "")}
              options={[{ value: "initial", label: "Initial Assessment" }, { value: "reassessment", label: "Re-Assessment" }]}
              onChange={(v) => updateFlat("initial_assessment", v)}
              error={errors.initial_assessment}
            />
            <View style={{ flex: 1, minWidth: "45%" }}>
              <Text style={[s.formLabel, { color: colors.text }]}>Date Performed</Text>
              <DateTimeField
                mode="date"
                value={String(data.flat.date_performed ?? "")}
                onChange={(v) => updateFlat("date_performed", v)}
                colors={colors}
                style={errors.date_performed ? { borderColor: "#EF4444", borderWidth: 1.5 } : undefined}
              />
              {errors.date_performed ? (
                <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#EF4444", marginTop: 3 }}>Required</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ─── Assessment: mental status, vitals, pain, nutrition ─────── */}
        <Acc title="Assessment" color="#0891B2" done={false} isOpen={!!sections.assessment} onToggle={() => toggleSection("assessment")} colors={colors} isReadOnly={isReadOnly} filled={assessmentFilled} total={assessmentTotal} style={{ marginBottom: 0 }}>
          <View style={{ gap: 12 }}>
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
            <View style={{ gap: 10 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Vitals & Nutrition</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <TextField fkey="bp_sys" label="BP Systolic" value={String(data.assessment.bp_sys ?? "")} onChangeText={() => {}} colors={colors} readOnly />
                <TextField fkey="bp_dias" label="BP Diastolic" value={String(data.assessment.bp_dias ?? "")} onChangeText={() => {}} colors={colors} readOnly />
                {ASSESSMENT_TEXT_FIELDS.map(({ key, label }) => (
                  <TextField key={key} fkey={key} label={label} value={String(data.assessment[key] ?? "")} onChangeText={(v) => updateAssessment(key, v)} colors={colors} />
                ))}
              </View>
            </View>
          </View>
        </Acc>

        {/* ─── Physical Assessment ─────────────────────────────────────── */}
        {/* <Acc title="Physical Assessment" color="#7C3AED" done={false} isOpen={!!sections.physical} onToggle={() => toggleSection("physical")} colors={colors} isReadOnly={isReadOnly} filled={physicalFilled} total={physicalTotal} style={{ marginBottom: 0 }}>
          <View style={{ gap: 12 }}>
            <View style={{ gap: 10 }}>
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
            <View style={{ gap: 10 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Throat/Dental</Text>
              <View style={{ flexDirection: "column", gap: 8 }}>
                <CheckboxField
                  label="WNL"
                  value={!!data.flat.throatOption}
                  onChange={(v) => setData((prev) => ({ ...prev, flat: { ...prev.flat, throatOption: v } }))}
                  disabled={isReadOnly}
                />
                <CheckboxField
                  label="Swollen LN / Lesions"
                  value={!!data.flat.swollen}
                  onChange={(v) => setData((prev) => ({ ...prev, flat: { ...prev.flat, swollen: v } }))}
                  disabled={isReadOnly}
                />
              </View>
              <TextField
                fkey="dentures"
                label="Dentures"
                value={String(data.flat.dentures ?? "")}
                onChangeText={(v) => updateFlat("dentures", v)}
                colors={colors}
              />
            </View>
            <View style={{ gap: 10 }}>
              {PHYSICAL_TEXT_FIELDS.map(({ key, label, multiline }) => (
                <TextField key={key} fkey={key} label={label} value={String(data.flat[key] ?? "")} onChangeText={(v) => updateFlat(key, v)} colors={colors} multiline={multiline} />
              ))}
            </View>
          </View>
        </Acc> */}

        {/* ─── Medical History ─────────────────────────────────────────── */}
        <Acc title="Medical History" color="#0EA5E9" done={false} isOpen={!!sections.medicalHistory} onToggle={() => toggleSection("medicalHistory")} colors={colors} isReadOnly={isReadOnly} filled={medicalHistoryFilled} total={medicalHistoryTotal} style={{ marginBottom: 0 }}>
          <View style={{ gap: 12 }}>
            <View style={{ gap: 10 }}>
              <TextField fkey="medical_history" label="Medical History" value={String(data.medical_surgical_history.medical_history ?? "")} onChangeText={(v) => updateMedicalHistory("medical_history", v)} colors={colors} multiline />
              <TextField fkey="icd_code" label="ICD Code" value={String(data.medical_surgical_history.icd_code ?? "")} onChangeText={(v) => updateMedicalHistory("icd_code", v)} colors={colors} />
            </View>
            <TextGrid fields={MEDICAL_HISTORY_TEXT_FIELDS} values={data.medical_surgical_history} onChange={updateMedicalHistory} colors={colors} />
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Current Contraptions and/or Equipment Use</Text>
              <View style={{ flexDirection: "row", gap: 20 }}>
                <View style={{ flex: 1 }}>
                  <RadioRow
                    options={CONTRAPTIONS_OPTIONS_G1}
                    value={String(data.medical_surgical_history.contraptions_equipment_g1 ?? "")}
                    onChange={(v) => updateMedicalHistory("contraptions_equipment_g1", v)}
                    colors={colors}
                    disabled={isReadOnly}
                    vertical
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <RadioRow
                    options={CONTRAPTIONS_OPTIONS_G2}
                    value={String(data.medical_surgical_history.contraptions_equipment_g2 ?? "")}
                    onChange={(v) => updateMedicalHistory("contraptions_equipment_g2", v)}
                    colors={colors}
                    disabled={isReadOnly}
                    vertical
                  />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 20 }}>
                <View style={{ flex: 1 }}>
                  {data.medical_surgical_history.contraptions_equipment_g1 === "Assistive" ? (
                    <TextField
                      fkey="contraptions_equipment_g1_assistive"
                      label="Assistive — Specify"
                      value={String(data.medical_surgical_history.contraptions_equipment_g1_assistive ?? "")}
                      onChangeText={(v) => updateMedicalHistory("contraptions_equipment_g1_assistive", v)}
                      colors={colors}
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  {data.medical_surgical_history.contraptions_equipment_g2 === "Others" ? (
                    <TextField
                      fkey="contraptions_equipment_g2_others"
                      label="Others — Specify"
                      value={String(data.medical_surgical_history.contraptions_equipment_g2_others ?? "")}
                      onChangeText={(v) => updateMedicalHistory("contraptions_equipment_g2_others", v)}
                      colors={colors}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        </Acc>

        {/* ─── Surgical History ────────────────────────────────────────── */}
        <Acc title="Surgical History" color="#F59E0B" done={false} isOpen={!!sections.surgicalHistory} onToggle={() => toggleSection("surgicalHistory")} colors={colors} isReadOnly={isReadOnly} filled={surgicalHistoryFilled} total={surgicalHistoryTotal} style={{ marginBottom: 0 }}>
          <View style={{ gap: 10 }}>
            {!isReadOnly && (
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); addSurgicalRow(); }} style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end" }}>
                <Feather name="plus-circle" size={16} color={Colors.primary} />
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary }}>Add</Text>
              </Pressable>
            )}
            {data.surgical_history.map((row, idx) => (
              <View key={idx} style={{ gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card }}>
                <TextField fkey={`sh_desc_${idx}`} label="Surgical History" value={row.surgical_history} onChangeText={(v) => updateSurgicalRow(idx, { surgical_history: v })} colors={colors} />
                <View style={{ gap: 10 }}>
                  <View>
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
        </Acc>

        {/* ─── Social History ──────────────────────────────────────────── */}
        <Acc title="Social History" color="#10B981" done={false} isOpen={!!sections.socialHistory} onToggle={() => toggleSection("socialHistory")} colors={colors} isReadOnly={isReadOnly} filled={socialHistoryFilled} total={socialHistoryTotal} style={{ marginBottom: 0 }}>
          <View style={{ gap: 12 }}>
            <SelectGrid fields={SOCIAL_HISTORY_SELECT_FIELDS} values={data.social_hostory} onChange={updateSocialHistory} />
            <TextGrid fields={SOCIAL_HISTORY_TEXT_FIELDS} values={data.social_hostory} onChange={updateSocialHistory} colors={colors} />
            <TextGrid title="Patient Information" fields={PATIENT_INFO_FIELDS} values={data.patient_information} onChange={updatePatientInfo} colors={colors} />
          </View>
        </Acc>

        {/* ─── Activities of Daily Living ──────────────────────────────── */}
        {/* <Acc title="Activities of Daily Living" color="#DB2777" done={false} isOpen={!!sections.adl} onToggle={() => toggleSection("adl")} colors={colors} isReadOnly={isReadOnly} filled={adlFilled} total={adlTotal} style={{ marginBottom: 0 }}>
          <SelectGrid fields={ADL_FIELDS.map((f) => ({ ...f, options: ADL }))} values={data.flat} onChange={updateFlat} />
        </Acc> */}

        {/* ─── Environmental Hazards / Safety Checklist ───────────────── */}
        {/* <Acc title="Environmental Hazards / Safety Checklist" color="#EA580C" done={false} isOpen={!!sections.environmental} onToggle={() => toggleSection("environmental")} colors={colors} isReadOnly={isReadOnly} filled={environmentalFilled} total={environmentalTotal} style={{ marginBottom: 0 }}>
          <View style={{ gap: 12 }}>
            <SelectGrid fields={ENVIRONMENTAL_FIELDS.map((f) => ({ ...f, options: YES_NO }))} values={data.flat} onChange={updateFlat} />
            <TextField fkey={ACTION_PLANNED_FIELD.key} label={ACTION_PLANNED_FIELD.label} value={String(data.flat[ACTION_PLANNED_FIELD.key] ?? "")} onChangeText={(v) => updateFlat(ACTION_PLANNED_FIELD.key, v)} colors={colors} multiline />
          </View>
        </Acc> */}

        {/* ─── Referral ────────────────────────────────────────────────── */}
        <Acc title="Referral" color="#3B82F6" done={false} isOpen={!!sections.referral} onToggle={() => toggleSection("referral")} colors={colors} isReadOnly={isReadOnly} filled={referralFilled} total={referralTotal} hasError={errors.assessment_signature} style={{ marginBottom: 0 }}>
          <View style={{ gap: 12 }}>
            <View style={{ gap: 10 }}>
              {REFERRAL_FLAGS.map(({ key, label }) => (
                <CheckboxField key={key} label={label} value={!!data.referral[key]} onChange={(v) => toggleReferral(key, v)} disabled={isReadOnly} />
              ))}
            </View>

            <TextGrid title="Assessor Details" fields={MISC_FIELDS} values={data.flat} onChange={updateFlat} colors={colors} />

            <AttestField
              label="Assessment Performed By"
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
          </View>
        </Acc>

        {!isReadOnly && (
          <View style={{ flexDirection: "row", gap: 10 }}>
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
