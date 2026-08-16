import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { AttestField } from "@/components/ui/AttestField";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface ConsentFormData {
  date: string;
  witness: string;
  location: string;
  national_id: string;
  stay_period: string;
  arrival_date: string;
  patient_name: string;
  contact_number: string;
  pr_email: string;
  pr_address: string;
  pr_contact_number: string;
  pr_contact_person: string;
  tr_email: string;
  tr_phone_number: string;
  tr_facility_name: string;
  tr_contact_person: string;
  patient_signature_signed_at: string | null;
  patient_signature_signed_by: string | number | null;
}

export const EMPTY_CONSENT_FORM: ConsentFormData = {
  date: "",
  witness: "",
  location: "",
  national_id: "",
  stay_period: "",
  arrival_date: "",
  patient_name: "",
  contact_number: "",
  pr_email: "",
  pr_address: "",
  pr_contact_number: "",
  pr_contact_person: "",
  tr_email: "",
  tr_phone_number: "",
  tr_facility_name: "",
  tr_contact_person: "",
  patient_signature_signed_at: null,
  patient_signature_signed_by: null,
};

// `date`, `national_id`, and `patient_name` are not editable inputs on the
// web form — they're auto-derived (today's date / the patient record) — so
// they're intentionally omitted from the visible field list below and
// auto-filled on save instead.
const FIELDS: { key: keyof ConsentFormData; label: string }[] = [
  { key: "witness", label: "Witness" },
  { key: "contact_number", label: "Contact Number" },
];

const DATE_FIELDS: { key: keyof ConsentFormData; label: string }[] = [
  { key: "arrival_date", label: "Date of Arrival" },
];

const STAY_FIELDS: { key: keyof ConsentFormData; label: string }[] = [
  { key: "stay_period", label: "Period of Stay" },
  { key: "location", label: "Location Of Stay" },
];

type FieldKind = "text" | "email" | "phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

const PR_FIELDS: { key: keyof ConsentFormData; label: string; kind?: FieldKind }[] = [
  { key: "pr_contact_person", label: "Contact Person" },
  { key: "pr_contact_number", label: "Contact Number", kind: "phone" },
  { key: "pr_email", label: "Email", kind: "email" },
  { key: "pr_address", label: "Address" },
];

const TR_FIELDS: { key: keyof ConsentFormData; label: string; kind?: FieldKind }[] = [
  { key: "tr_facility_name", label: "Facility Name" },
  { key: "tr_contact_person", label: "Contact Person" },
  { key: "tr_phone_number", label: "Phone Number", kind: "phone" },
  { key: "tr_email", label: "Email", kind: "email" },
];

/** Email fields that must be a valid address (or blank) before saving — the
 *  API 422s on a malformed `pr_email`/`tr_email`. */
const EMAIL_FIELD_KEYS: (keyof ConsentFormData)[] = ["pr_email", "tr_email"];

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: ConsentFormData | null;
  isSaving?: boolean;
  onSave: (data: ConsentFormData) => void;
  currentUserId: string | number;
  currentUserName?: string;
  /** Patient name/id — used to auto-fill `patient_name` on save and as
   *  context under the signature widget (mirrors the web form, which shows
   *  "<patient name> (ID: <id>)" instead of asking the nurse to retype it). */
  patientName?: string;
  patientId?: string | number;
  t: (key: any) => string;
}

function FieldGroup({
  title,
  fields,
  data,
  update,
  colors,
}: {
  title?: string;
  fields: { key: keyof ConsentFormData; label: string; kind?: FieldKind }[];
  data: ConsentFormData;
  update: (key: keyof ConsentFormData, value: string) => void;
  colors: any;
}) {
  return (
    <View style={{ gap: 10 }}>
      {title ? (
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#0891B2" }}>{title}</Text>
      ) : null}
      {fields.map(({ key, label, kind = "text" }) => {
        const value = String(data[key] ?? "");
        const invalid = kind === "email" && value.trim() !== "" && !isValidEmail(value);
        return (
          <View key={key}>
            <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
            <TextInput
              style={[
                s.formInput,
                { color: colors.text, backgroundColor: colors.surface, borderColor: invalid ? "#EF4444" : colors.border },
              ]}
              value={value}
              onChangeText={(v) => update(key, v)}
              placeholder={label}
              placeholderTextColor={colors.textTertiary}
              keyboardType={kind === "email" ? "email-address" : kind === "phone" ? "phone-pad" : "default"}
              autoCapitalize={kind === "email" ? "none" : "sentences"}
              autoCorrect={kind !== "email"}
            />
            {invalid ? (
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#EF4444", marginTop: 4 }}>
                Enter a valid email address (e.g. name@example.com)
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function DateFieldGroup({
  fields,
  data,
  update,
  colors,
}: {
  fields: { key: keyof ConsentFormData; label: string }[];
  data: ConsentFormData;
  update: (key: keyof ConsentFormData, value: string) => void;
  colors: any;
}) {
  return (
    <View style={{ gap: 10 }}>
      {fields.map(({ key, label }) => (
        <View key={key}>
          <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
          <DateTimeField mode="date" value={String(data[key] ?? "")} onChange={(v) => update(key, v)} colors={colors} />
        </View>
      ))}
    </View>
  );
}

export function ConsentFormForm({
  colors,
  isReadOnly,
  initialExpanded,
  initial,
  isSaving = false,
  onSave,
  currentUserId,
  currentUserName,
  patientName,
  patientId,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [data, setData] = useState<ConsentFormData>(() => initial ?? { ...EMPTY_CONSENT_FORM });

  useEffect(() => {
    if (!initial) return;
    setData(initial);
  }, [initial]);

  const update = (key: keyof ConsentFormData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const signatureSubtitle = patientName
    ? patientId != null
      ? `${patientName} (ID: ${patientId})`
      : patientName
    : undefined;

  const emailsValid = EMAIL_FIELD_KEYS.every((key) => {
    const value = String(data[key] ?? "").trim();
    return value === "" || isValidEmail(value);
  });

  const handleSave = () => {
    if (!emailsValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      ...data,
      // Auto-derived — not user-editable — matching the web form.
      date: data.date || new Date().toISOString().slice(0, 10),
      patient_name: data.patient_name || patientName || "",
    });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData({ ...EMPTY_CONSENT_FORM });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("consentFormTitle")}
        icon="file-text"
        iconColor="#8B5CF6"
        badges={isReadOnly ? [{ text: t("readOnly"), bg: colors.borderLight, fg: colors.textSecondary }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 16 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        <AttestField
          label="Patient Signature"
          subtitle={signatureSubtitle}
          value={{ signedAt: data.patient_signature_signed_at, signedBy: data.patient_signature_signed_by }}
          onChange={(v) =>
            setData((prev) => ({ ...prev, patient_signature_signed_at: v.signedAt ?? null, patient_signature_signed_by: v.signedBy ?? null }))
          }
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          colors={colors}
          disabled={isReadOnly}
        />

        <FieldGroup fields={FIELDS} data={data} update={update} colors={colors} />
        <DateFieldGroup fields={DATE_FIELDS} data={data} update={update} colors={colors} />
        <FieldGroup fields={STAY_FIELDS} data={data} update={update} colors={colors} />
        <FieldGroup title="Primary HHD Team Contact Information" fields={PR_FIELDS} data={data} update={update} colors={colors} />
        <FieldGroup title="Traveling HHD Team Information" fields={TR_FIELDS} data={data} update={update} colors={colors} />

        {!isReadOnly && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <Pressable
              style={[s.saveFlowBtn, { backgroundColor: emailsValid && !isSaving ? Colors.primary : colors.border, flex: 1, opacity: isSaving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={isSaving || !emailsValid}
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
