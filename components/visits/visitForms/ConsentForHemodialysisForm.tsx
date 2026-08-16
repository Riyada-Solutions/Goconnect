import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { AttestField } from "@/components/ui/AttestField";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { SignatureField, type SignatureValue } from "@/components/ui/SignatureField";
import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

/**
 * The web form (`INFORMED CONSENT FOR HOME HEMODIALYSIS`) renders as two
 * fully independent language columns — separate text fields AND separate
 * drawn signatures for English vs Arabic (confirmed visually: the two
 * `person_consent_signature*` captures are genuinely different drawings on
 * the live form, not a mirrored value). `witness_signature` also has an
 * independent `_ar` sign-off (`witness_signature_ar_signed_at` /
 * `witness_signature_ar_signed_by`), so it's captured once per language.
 */
export interface ConsentForHemodialysisSideData {
  hospital: string;
  doctorName: string;
  patientAge: string;
  consentDate: string;
  personGivingConsent: string;
  personConsentSignature: SignatureValue;
}

export interface ConsentForHemodialysisData {
  en: ConsentForHemodialysisSideData;
  ar: ConsentForHemodialysisSideData;
  witness_signature_signed_at: string | null;
  witness_signature_signed_by: string | number | null;
  witness_signature_ar_signed_at: string | null;
  witness_signature_ar_signed_by: string | number | null;
}

const emptySide = (): ConsentForHemodialysisSideData => ({
  hospital: "",
  doctorName: "",
  patientAge: "",
  consentDate: "",
  personGivingConsent: "",
  personConsentSignature: { signed: false },
});

export const EMPTY_CONSENT_FOR_HEMODIALYSIS: ConsentForHemodialysisData = {
  en: emptySide(),
  ar: emptySide(),
  witness_signature_signed_at: null,
  witness_signature_signed_by: null,
  witness_signature_ar_signed_at: null,
  witness_signature_ar_signed_by: null,
};

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: ConsentForHemodialysisData | null;
  isSaving?: boolean;
  onSave: (data: ConsentForHemodialysisData) => void;
  currentUserId: string | number;
  currentUserName?: string;
  t: (key: any) => string;
}

interface SideProps {
  title: string;
  isRtl: boolean;
  data: ConsentForHemodialysisSideData;
  onChange: (v: ConsentForHemodialysisSideData) => void;
  colors: any;
  isReadOnly: boolean;
}

function ConsentSide({ title, isRtl, data, onChange, colors, isReadOnly }: SideProps) {
  const align = isRtl ? ("right" as const) : ("left" as const);
  const writingDirection = isRtl ? ("rtl" as const) : ("ltr" as const);
  const update = <K extends keyof ConsentForHemodialysisSideData>(key: K, value: ConsentForHemodialysisSideData[K]) =>
    onChange({ ...data, [key]: value });

  const TEXT_FIELDS: { key: keyof ConsentForHemodialysisSideData; label: string }[] = [
    { key: "hospital", label: isRtl ? "المستشفى" : "Hospital" },
    { key: "doctorName", label: isRtl ? "اسم الطبيب" : "Doctor Name" },
    { key: "patientAge", label: isRtl ? "اسم المريض والعمر" : "Patient Name & Age" },
    { key: "personGivingConsent", label: isRtl ? "الاسم للشخص الذي يعطي الموافقة" : "Name of Person Giving Consent" },
  ];

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#DB2777", textAlign: align, writingDirection }}>
        {title}
      </Text>
      {TEXT_FIELDS.map(({ key, label }) => (
        <View key={key}>
          <Text style={[s.formLabel, { color: colors.text, textAlign: align, writingDirection }]}>{label}</Text>
          <TextInput
            style={[
              s.formInput,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, textAlign: align, writingDirection },
            ]}
            value={data[key] as string}
            onChangeText={(v) => update(key, v as any)}
            placeholder={label}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      ))}
      <View>
        <Text style={[s.formLabel, { color: colors.text, textAlign: align, writingDirection }]}>
          {isRtl ? "تاريخ الموافقة" : "Consent Date"}
        </Text>
        <DateTimeField mode="date" value={data.consentDate} onChange={(v) => update("consentDate", v)} colors={colors} isRtl={isRtl} />
      </View>
      <SignatureField
        label={isRtl ? "توقيع الشخص الذي يعطي الموافقة" : "Signature of Person Giving Consent"}
        value={data.personConsentSignature}
        onChange={(v) => update("personConsentSignature", v)}
        subtitle={data.personGivingConsent || undefined}
        accentColor="#DB2777"
        disabled={isReadOnly}
      />
    </View>
  );
}

export function ConsentForHemodialysisForm({
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
  const [data, setData] = useState<ConsentForHemodialysisData>(() => initial ?? { ...EMPTY_CONSENT_FOR_HEMODIALYSIS });

  useEffect(() => {
    if (!initial) return;
    setData(initial);
  }, [initial]);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(data);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData({ ...EMPTY_CONSENT_FOR_HEMODIALYSIS, en: emptySide(), ar: emptySide() });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("consentForHemodialysisTitle")}
        icon="clipboard"
        iconColor="#DB2777"
        badges={isReadOnly ? [{ text: t("readOnly"), bg: colors.borderLight, fg: colors.textSecondary }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 20 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        <ConsentSide
          title="English"
          isRtl={false}
          data={data.en}
          onChange={(v) => setData((prev) => ({ ...prev, en: v }))}
          colors={colors}
          isReadOnly={isReadOnly}
        />

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

        <ConsentSide
          title="العربية"
          isRtl
          data={data.ar}
          onChange={(v) => setData((prev) => ({ ...prev, ar: v }))}
          colors={colors}
          isReadOnly={isReadOnly}
        />

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

        <AttestField
          label="Witness Sign-off (English)"
          value={{ signedAt: data.witness_signature_signed_at, signedBy: data.witness_signature_signed_by }}
          onChange={(v) => setData((prev) => ({ ...prev, witness_signature_signed_at: v.signedAt ?? null, witness_signature_signed_by: v.signedBy ?? null }))}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          colors={colors}
          disabled={isReadOnly}
        />

        <AttestField
          label="توقيع الشاهد (عربي)"
          value={{ signedAt: data.witness_signature_ar_signed_at, signedBy: data.witness_signature_ar_signed_by }}
          onChange={(v) => setData((prev) => ({ ...prev, witness_signature_ar_signed_at: v.signedAt ?? null, witness_signature_ar_signed_by: v.signedBy ?? null }))}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          colors={colors}
          disabled={isReadOnly}
        />

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
