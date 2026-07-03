import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { AttestField } from "@/components/ui/AttestField";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { SelectField } from "@/components/ui/SelectField";
import { SignatureField, type SignatureValue } from "@/components/ui/SignatureField";
import { StaffPickerField, type StaffValue } from "@/components/ui/StaffPickerField";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface PatientResponsibilityData {
  date: string;
  balance_chair: string;
  kidney_device: string;
  kidney_medical_bed: string;
  social_worker: string;
  social_worker_id: string | number;
  on_charge_nurse: string;
  on_charge_nurse_id: string | number;
  attending_physician: string;
  attending_physician_id: string | number;
  companion_relation: string;
  custom_relation: string;
  companion_national_id: string;
  companion_signature_signed_at: string | null;
  companion_signature_signature_url: string | null;
  companion_signature_signature_name: string;
  social_worker_signature_signed_at: string | null;
  social_worker_signature_signed_by: string | number | null;
  on_charge_nurse_signature_signed_at: string | null;
  on_charge_nurse_signature_signed_by: string | number | null;
  attending_physician_signature_signed_at: string | null;
  attending_physician_signature_signed_by: string | number | null;
}

export const EMPTY_PATIENT_RESPONSIBILITY: PatientResponsibilityData = {
  date: "",
  balance_chair: "",
  kidney_device: "",
  kidney_medical_bed: "",
  social_worker: "",
  social_worker_id: "",
  on_charge_nurse: "",
  on_charge_nurse_id: "",
  attending_physician: "",
  attending_physician_id: "",
  companion_relation: "",
  custom_relation: "",
  companion_national_id: "",
  companion_signature_signed_at: null,
  companion_signature_signature_url: null,
  companion_signature_signature_name: "",
  social_worker_signature_signed_at: null,
  social_worker_signature_signed_by: null,
  on_charge_nurse_signature_signed_at: null,
  on_charge_nurse_signature_signed_by: null,
  attending_physician_signature_signed_at: null,
  attending_physician_signature_signed_by: null,
};

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

const RELATION_OPTIONS = [
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Spouse", label: "Spouse" },
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Brother", label: "Brother" },
  { value: "Sister", label: "Sister" },
  { value: "other", label: "Other" },
] as const;

/** Saudi national ID / iqama: exactly 10 digits, starting with 1 (citizen) or 2 (resident). */
const NATIONAL_ID_RE = /^[12]\d{9}$/;

function getValidationErrors(data: PatientResponsibilityData): string[] {
  const errors: string[] = [];
  if (!data.date) errors.push("Date is required.");
  if (!data.balance_chair) errors.push("Balance Chair answer is required.");
  if (!data.kidney_device) errors.push("Kidney Device answer is required.");
  if (!data.kidney_medical_bed) errors.push("Kidney Medical Bed answer is required.");
  if (!data.social_worker || !data.social_worker_id) errors.push("Social Worker must be selected.");
  if (!data.on_charge_nurse || !data.on_charge_nurse_id) errors.push("On-Charge Nurse must be selected.");
  if (!data.attending_physician || !data.attending_physician_id) errors.push("Attending Physician must be selected.");

  const relation = data.companion_relation === "other" ? data.custom_relation : data.companion_relation;
  if (!relation?.trim()) errors.push("Companion relation is required.");

  const nationalId = data.companion_national_id.trim();
  if (!nationalId) errors.push("Companion National ID is required.");
  else if (!NATIONAL_ID_RE.test(nationalId)) errors.push("Companion National ID must be 10 digits, starting with 1 or 2.");

  if (!data.companion_signature_signature_url) errors.push("Companion signature is required.");
  if (!data.social_worker_signature_signed_at) errors.push("Social Worker sign-off is required.");
  if (!data.on_charge_nurse_signature_signed_at) errors.push("On-Charge Nurse sign-off is required.");
  if (!data.attending_physician_signature_signed_at) errors.push("Attending Physician sign-off is required.");

  return errors;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: PatientResponsibilityData | null;
  isSaving?: boolean;
  onSave: (data: PatientResponsibilityData) => void;
  currentUserId: string | number;
  currentUserName?: string;
  t: (key: any) => string;
}

function TextField({
  label,
  value,
  onChangeText,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

export function PatientResponsibilityForm({
  colors,
  isReadOnly,
  initialExpanded,
  initial,
  isSaving = false,
  onSave,
  currentUserId,
  currentUserName,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<PatientResponsibilityData>(() => initial ?? { ...EMPTY_PATIENT_RESPONSIBILITY });

  useEffect(() => {
    if (!initial) return;
    // The backend round-trips `date` as `YYYY/MM/DD` (slash-separated), but
    // `DateTimeField` (mode="date") expects `YYYY-MM-DD` — normalize on load
    // so an existing saved date renders/edits correctly instead of showing
    // blank or resetting when the field is touched.
    const date = /^\d{4}\/\d{2}\/\d{2}$/.test(initial.date) ? initial.date.replace(/\//g, "-") : initial.date;
    setData({ ...initial, date });
  }, [initial]);

  const update = <K extends keyof PatientResponsibilityData>(key: K, value: PatientResponsibilityData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const companionSignatureValue: SignatureValue = {
    signed: !!data.companion_signature_signature_url,
    dataUrl: data.companion_signature_signature_url ?? undefined,
    signedAt: data.companion_signature_signed_at ?? undefined,
    signatureUrl: data.companion_signature_signature_url ?? undefined,
  };

  const socialWorkerValue: StaffValue = { id: data.social_worker_id || null, name: data.social_worker };
  const onChargeNurseValue: StaffValue = { id: data.on_charge_nurse_id || null, name: data.on_charge_nurse };
  const attendingPhysicianValue: StaffValue = { id: data.attending_physician_id || null, name: data.attending_physician };

  const [showErrors, setShowErrors] = useState(false);
  const errors = getValidationErrors(data);

  const handleSave = () => {
    if (errors.length > 0) {
      setShowErrors(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setShowErrors(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(data);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowErrors(false);
    setData({ ...EMPTY_PATIENT_RESPONSIBILITY });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("patientResponsibilityTitle")}
        icon="shield"
        iconColor="#0EA5E9"
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 16 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Date</Text>
          <DateTimeField mode="date" value={data.date} onChange={(v) => update("date", v)} colors={colors} />
        </View>

        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <SelectField label="Balance Chair" value={data.balance_chair || null} options={YES_NO} placeholder="Select" onChange={(v) => update("balance_chair", v)} />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label="Kidney Device" value={data.kidney_device || null} options={YES_NO} placeholder="Select" onChange={(v) => update("kidney_device", v)} />
          </View>
        </View>
        <SelectField label="Kidney Medical Bed" value={data.kidney_medical_bed || null} options={YES_NO} placeholder="Select" onChange={(v) => update("kidney_medical_bed", v)} />

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Care Team</Text>
          <StaffPickerField
            label="Attending Physician"
            employeeType="physician"
            value={attendingPhysicianValue}
            placeholder="Select physician"
            disabled={isReadOnly}
            invalid={showErrors && (!data.attending_physician || !data.attending_physician_id)}
            onChange={(v) =>
              setData((prev) => ({ ...prev, attending_physician: v.name, attending_physician_id: v.id ?? "" }))
            }
          />
          <StaffPickerField
            label="On-Charge Nurse"
            employeeType="nurse"
            value={onChargeNurseValue}
            placeholder="Select nurse"
            disabled={isReadOnly}
            invalid={showErrors && (!data.on_charge_nurse || !data.on_charge_nurse_id)}
            onChange={(v) =>
              setData((prev) => ({ ...prev, on_charge_nurse: v.name, on_charge_nurse_id: v.id ?? "" }))
            }
          />
          <StaffPickerField
            label="Social Worker"
            employeeType="social_worker"
            value={socialWorkerValue}
            placeholder="Select social worker"
            disabled={isReadOnly}
            invalid={showErrors && (!data.social_worker || !data.social_worker_id)}
            onChange={(v) =>
              setData((prev) => ({ ...prev, social_worker: v.name, social_worker_id: v.id ?? "" }))
            }
          />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Companion</Text>
          <SelectField
            label="Relation"
            value={data.companion_relation || null}
            options={RELATION_OPTIONS}
            placeholder="Select relation"
            onChange={(v) => update("companion_relation", v)}
          />
          {data.companion_relation === "other" ? (
            <TextField label="Custom Relation" value={data.custom_relation} onChangeText={(v) => update("custom_relation", v)} colors={colors} />
          ) : null}
          <View>
            <Text style={[s.formLabel, { color: colors.text }]}>National ID</Text>
            <TextInput
              style={[
                s.formInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: showErrors && !NATIONAL_ID_RE.test(data.companion_national_id.trim()) ? "#EF4444" : colors.border,
                },
              ]}
              value={data.companion_national_id}
              onChangeText={(v) => update("companion_national_id", v.replace(/[^0-9]/g, "").slice(0, 10))}
              placeholder="10-digit national ID / iqama"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          <TextField
            label="Companion Name (for signature)"
            value={data.companion_signature_signature_name}
            onChangeText={(v) => update("companion_signature_signature_name", v)}
            colors={colors}
          />
          <SignatureField
            label="Companion Signature"
            value={companionSignatureValue}
            onChange={(v) =>
              setData((prev) => ({
                ...prev,
                companion_signature_signed_at: v.signedAt ?? prev.companion_signature_signed_at,
                companion_signature_signature_url: v.signatureUrl ?? v.dataUrl ?? null,
              }))
            }
            subtitle={data.companion_signature_signature_name || undefined}
            accentColor="#0EA5E9"
            disabled={isReadOnly}
          />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>Sign-offs</Text>
          <AttestField
            label="Social Worker Sign-off"
            value={{ signedAt: data.social_worker_signature_signed_at, signedBy: data.social_worker_signature_signed_by }}
            onChange={(v) => setData((prev) => ({ ...prev, social_worker_signature_signed_at: v.signedAt ?? null, social_worker_signature_signed_by: v.signedBy ?? null }))}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            colors={colors}
            disabled={isReadOnly}
          />
          <AttestField
            label="On-Charge Nurse Sign-off"
            value={{ signedAt: data.on_charge_nurse_signature_signed_at, signedBy: data.on_charge_nurse_signature_signed_by }}
            onChange={(v) => setData((prev) => ({ ...prev, on_charge_nurse_signature_signed_at: v.signedAt ?? null, on_charge_nurse_signature_signed_by: v.signedBy ?? null }))}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            colors={colors}
            disabled={isReadOnly}
          />
          <AttestField
            label="Attending Physician Sign-off"
            value={{ signedAt: data.attending_physician_signature_signed_at, signedBy: data.attending_physician_signature_signed_by }}
            onChange={(v) => setData((prev) => ({ ...prev, attending_physician_signature_signed_at: v.signedAt ?? null, attending_physician_signature_signed_by: v.signedBy ?? null }))}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            colors={colors}
            disabled={isReadOnly}
          />
        </View>

        {showErrors && errors.length > 0 ? (
          <View style={{ padding: 10, borderRadius: 8, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FCA5A5", gap: 3 }}>
            {errors.map((err) => (
              <Text key={err} style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#B91C1C" }}>
                • {err}
              </Text>
            ))}
          </View>
        ) : null}

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
      </CollapsibleBody>
    </Card>
  );
}
