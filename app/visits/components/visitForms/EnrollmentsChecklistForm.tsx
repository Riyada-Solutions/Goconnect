import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { AttestField } from "@/components/ui/AttestField";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { SelectField } from "@/components/ui/SelectField";
import { Colors } from "@/theme/colors";
import { DateTimeConverter } from "@/utils/datetime";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { ReadOnlyField } from "../ReadOnlyField";

export type AppendixBSection = Record<string, boolean | string | number | null>;
export type AppendixCSection = Record<string, string | number | null>;
export type DemographicsSection = Record<string, string>;
export type OverAllFeedbackSection = Record<string, string | number | null>;

export interface EnrollmentsChecklistData {
  appendixB: AppendixBSection;
  appendixC: AppendixCSection;
  demographics: DemographicsSection;
  overAllFeedback: OverAllFeedbackSection;
}

export const EMPTY_ENROLLMENTS_CHECKLIST: EnrollmentsChecklistData = {
  appendixB: {},
  appendixC: {},
  demographics: {},
  overAllFeedback: {},
};

// ─── Appendix B — home-readiness checklist ─────────────────────────────────
// Each item is a boolean; checking it stamps `${signedKey}_signed_at` /
// `${signedKey}_signed_by` with the current employee (the checkbox itself IS
// the attestation, matching how the web form pairs each item with a sign-off).
const APPENDIX_B_ITEMS: { key: string; signedKey?: string; label: string }[] = [
  { key: "waste_drain", label: "Waste drain available" },
  { key: "bed_available", label: "Bed available" },
  { key: "care_provider", label: "Care provider available" },
  { key: "curtain_washable", label: "Curtain washable" },
  { key: "electricity_outlet", label: "Electricity outlet available" },
  { key: "bathroom_close_dialysis", signedKey: "bathroom_close", label: "Bathroom close to dialysis area" },
  { key: "floor_easy_cleaned", label: "Floor easy to clean" },
  { key: "table_available_for_the_machine", label: "Table available for the machine" },
];
const APPENDIX_B_STANDALONE_ATTESTATIONS: { key: string; label: string }[] = [
  { key: "cleaned", label: "Area Cleaned — confirmed" },
  { key: "machine", label: "Machine Ready — confirmed" },
];

// ─── Appendix C — "Pre-Enrollments Checklist" document checklist ──────────
// Each item is a date; filling it in stamps `${key}_signed_at` / `_signed_by`
// with the current employee, plus a free-text staff name. Labels below match
// the live web form's row text (`hhd.careconnectksa.com`); the row→key
// mapping is inferred from label semantics (matched against a real payload's
// key set) since that host uses separate credentials we don't have — verify
// against production before relying on it for anything safety-critical.
const APPENDIX_C_ITEMS: { key: string; label: string }[] = [
  { key: "hhd_date", label: "HHD services received official e-mail from the referred Hospital" },
  { key: "concent_date", label: "Consent for Home Hemodialysis Procedure" },
  { key: "program_referal_date", label: "Home Hemodialysis Program Referral Request to the White Hand Pioneers" },
  { key: "medical_report_date", label: "Medical report and Discharge summary" },
  { key: "xray_date", label: "Recent X-ray and ECG if available" },
  { key: "medication_list_date", label: "Medication List" },
  { key: "lab_result_date", label: "Recent Labs' results" },
  { key: "dialysis_order_date", label: "Dialysis Order" },
  { key: "patient_phone_call_date", label: "Patient's Contact Number" },
  { key: "nurse_new_file_date", label: "HHD — Nursing manager/her designee will prepare new file" },
  { key: "nurse_discussion_date", label: "HHD — Nursing manager/her designee and Physician Team Leader discussed the referral documents" },
  { key: "patient_number_date", label: "HHD — Social worker team leader will conduct a phone call to the patient/family to prepare the required home settings and book a home visit appointment" },
  { key: "obtained_concent_date", label: "HHD — Consent will be obtained from Patient/His Guardian" },
];

// Read-only — these come straight from the patient/referral record, never
// typed by the nurse.
const DEMOGRAPHICS_READONLY_TEXT_FIELDS: { key: string; label: string }[] = [
  { key: "patient_mrn", label: "Patient MRN" },
  { key: "patient_name", label: "Patient Name" },
  { key: "referred_hospital", label: "Referred Hospital" },
  { key: "primary_physician_name", label: "Primary Physician Name" },
  { key: "primary_social_worker_name", label: "Primary Social Worker Name" },
  { key: "nurse_manager_time", label: "Nurse Manager Time" },
];
const DEMOGRAPHICS_READONLY_DATE_FIELDS: { key: string; label: string }[] = [
  { key: "referral_date", label: "Date of Referral" },
  { key: "home_acceptance_date", label: "Date of Home Settings Acceptance" },
  { key: "medical_acceptance_date", label: "Date of Medical Acceptance" },
  { key: "first_hhd_treatment_date", label: "Date of First HHD Treatment" },
];

const ACCEPTANCE_OPTIONS = [
  { value: "acceptable", label: "Acceptable" },
  { value: "not_acceptable", label: "Not Acceptable" },
  { value: "reevaluation_recommended", label: "Reevaluation Recommended If Yes," },
] as const;

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: EnrollmentsChecklistData | null;
  /** Demographics pulled live from the patient/referral record — rendered
   *  read-only and merged into the saved payload regardless of what (if
   *  anything) was previously stored on the checklist. */
  demographicsFromVisit?: DemographicsSection | null;
  isSaving?: boolean;
  onSave: (data: EnrollmentsChecklistData) => void;
  currentUserId: string | number;
  currentUserName?: string;
  t: (key: any) => string;
}

export function EnrollmentsChecklistForm({
  colors,
  isReadOnly,
  initialExpanded,
  initial,
  demographicsFromVisit,
  isSaving = false,
  onSave,
  currentUserId,
  currentUserName,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<EnrollmentsChecklistData>(() =>
    initial ?? { ...EMPTY_ENROLLMENTS_CHECKLIST },
  );

  useEffect(() => {
    if (!initial) return;
    setData(initial);
  }, [initial]);

  // Keep the read-only demographics in sync with the live visit record so
  // the saved payload always reflects current patient/referral data.
  useEffect(() => {
    if (!demographicsFromVisit) return;
    setData((prev) => ({ ...prev, demographics: { ...prev.demographics, ...demographicsFromVisit } }));
  }, [demographicsFromVisit]);

  const updateSection = <S extends keyof EnrollmentsChecklistData>(
    section: S,
    patch: Partial<EnrollmentsChecklistData[S]>,
  ) => setData((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));

  const toggleAppendixBItem = (item: (typeof APPENDIX_B_ITEMS)[number], next: boolean) => {
    const signedKey = item.signedKey ?? item.key;
    updateSection("appendixB", {
      [item.key]: next,
      [`${signedKey}_signed_at`]: next ? new Date().toISOString() : null,
      [`${signedKey}_signed_by`]: next ? currentUserId : null,
    } as Partial<AppendixBSection>);
  };

  const setAppendixCDate = (key: string, value: string) => {
    updateSection("appendixC", {
      [key]: value,
      [`${key}_signed_at`]: value ? new Date().toISOString() : null,
      [`${key}_signed_by`]: value ? currentUserId : null,
    } as Partial<AppendixCSection>);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(data);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData({ ...EMPTY_ENROLLMENTS_CHECKLIST });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("enrollmentsChecklistTitle")}
        icon="check-square"
        iconColor="#059669"
        badges={isReadOnly ? [{ text: t("readOnly"), bg: colors.borderLight, fg: colors.textSecondary }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 18 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        {/* ─── Demographics ─────────────────────────────────────────── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Demographics</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {[...DEMOGRAPHICS_READONLY_TEXT_FIELDS, ...DEMOGRAPHICS_READONLY_DATE_FIELDS].map(({ key, label }) => (
              <ReadOnlyField
                key={key}
                label={label}
                value={data.demographics[key]}
                colors={colors}
                style={{ width: "47%" }}
              />
            ))}
          </View>
        </View>

        {/* ─── Appendix B: Home Readiness ───────────────────────────── */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>
            Appendix B — Home Readiness Checklist
          </Text>
          {APPENDIX_B_ITEMS.map((item) => (
            <CheckboxField
              key={item.key}
              label={item.label}
              value={!!data.appendixB[item.key]}
              onChange={(v) => toggleAppendixBItem(item, v)}
              disabled={isReadOnly}
            />
          ))}
          {APPENDIX_B_STANDALONE_ATTESTATIONS.map((att) => (
            <AttestField
              key={att.key}
              label={att.label}
              value={{
                signedAt: data.appendixB[`${att.key}_signed_at`] as string | null,
                signedBy: data.appendixB[`${att.key}_signed_by`] as string | number | null,
              }}
              onChange={(v) =>
                updateSection("appendixB", {
                  [`${att.key}_signed_at`]: v.signedAt ?? null,
                  [`${att.key}_signed_by`]: v.signedBy ?? null,
                } as Partial<AppendixBSection>)
              }
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              colors={colors}
              disabled={isReadOnly}
            />
          ))}
        </View>

        {/* ─── Appendix C: Document Checklist ───────────────────────── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>
            Appendix C — Document Checklist
          </Text>
          {APPENDIX_C_ITEMS.map(({ key, label }) => (
            <View key={key} style={{ gap: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
              <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
              <DateTimeField
                mode="date"
                value={String(data.appendixC[key] ?? "")}
                onChange={(v) => setAppendixCDate(key, v)}
                colors={colors}
              />
              <TextInput
                style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={String(data.appendixC[`${key}_stuff_name`] ?? "")}
                onChangeText={(v) => updateSection("appendixC", { [`${key}_stuff_name`]: v })}
                placeholder="Staff name"
                placeholderTextColor={colors.textTertiary}
              />
              {data.appendixC[`${key}_signed_at`] ? (
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#059669" }}>
                  Confirmed {DateTimeConverter.dateTime(data.appendixC[`${key}_signed_at`] as string)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* ─── Overall Feedback ──────────────────────────────────────── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Overall Feedback</Text>
          <SelectField
            label="Acceptance"
            value={(data.overAllFeedback.acceptance as string) || null}
            options={ACCEPTANCE_OPTIONS}
            placeholder="Select"
            onChange={(v) => updateSection("overAllFeedback", { acceptance: v })}
          />
          <View style={s.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.formLabel, { color: colors.text }]}>Visit Date</Text>
              <DateTimeField
                mode="date"
                value={String(data.overAllFeedback.nd_visit_date ?? "")}
                onChange={(v) => updateSection("overAllFeedback", { nd_visit_date: v })}
                colors={colors}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.formLabel, { color: colors.text }]}>Final Date</Text>
              <DateTimeField
                mode="date"
                value={String(data.overAllFeedback.nd_final ?? "")}
                onChange={(v) => updateSection("overAllFeedback", { nd_final: v })}
                colors={colors}
              />
            </View>
          </View>
          {[
            { key: "nurse_name", label: "Nurse Name" },
            { key: "primary_physician", label: "Primary Physician" },
            { key: "medical_director_name", label: "Medical Director Name" },
          ].map(({ key, label }) => (
            <View key={key}>
              <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
              <TextInput
                style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={String(data.overAllFeedback[key] ?? "")}
                onChangeText={(v) => updateSection("overAllFeedback", { [key]: v })}
                placeholder={label}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          ))}

          <AttestField
            label="Nurse Sign-off"
            value={{ signedAt: data.overAllFeedback.nurse_signature_signed_at as string | null, signedBy: data.overAllFeedback.nurse_signature_signed_by as string | number | null }}
            onChange={(v) => updateSection("overAllFeedback", { nurse_signature_signed_at: v.signedAt ?? null, nurse_signature_signed_by: v.signedBy ?? null })}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            colors={colors}
            disabled={isReadOnly}
          />
          <AttestField
            label="Physician Sign-off"
            value={{ signedAt: data.overAllFeedback.physician_signature_signed_at as string | null, signedBy: data.overAllFeedback.physician_signature_signed_by as string | number | null }}
            onChange={(v) => updateSection("overAllFeedback", { physician_signature_signed_at: v.signedAt ?? null, physician_signature_signed_by: v.signedBy ?? null })}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            colors={colors}
            disabled={isReadOnly}
          />
          <AttestField
            label="Medical Director Sign-off"
            value={{ signedAt: data.overAllFeedback.medical_director_signature_signed_at as string | null, signedBy: data.overAllFeedback.medical_director_signature_signed_by as string | number | null }}
            onChange={(v) => updateSection("overAllFeedback", { medical_director_signature_signed_at: v.signedAt ?? null, medical_director_signature_signed_by: v.signedBy ?? null })}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            colors={colors}
            disabled={isReadOnly}
          />
        </View>

        {!isReadOnly && (
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
            <Pressable style={[s.saveFlowBtn, { backgroundColor: "#EF4444", flex: 1 }]} onPress={handleClear}>
              <Feather name="trash-2" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("clear")}</Text>
            </Pressable>
          </View>
        )}
      </CollapsibleBody>
    </Card>
  );
}
