import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { SelectField } from "@/components/ui/SelectField";
import { useAttachmentUpload } from "@/hooks/useAttachmentUpload";
import { useHospitals } from "@/hooks/useHospitals";
import { Colors } from "@/theme/colors";
import {
  REFERRAL_TYPES,
  type Referral,
  type ReferralPrintOptions,
  type ReferralStatus,
} from "@/data/models/referral";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

const EMPTY_PRINT: ReferralPrintOptions = {
  monthlyMedicalReport: false,
  systemMedicalReport: false,
  labResult: false,
  last3FlowSheets: false,
};

export interface ReferralFormData {
  referralDate: string;
  referralType: string;
  otherReferralType: string | null;
  referralHospitalId: number;
  printOptions: ReferralPrintOptions;
  referralReason: string;
  completionDate: string;
  comments: string;
  status: ReferralStatus;
  referralBy: string;
  primaryPhysician: string;
  attachmentUri?: string;
  attachmentName?: string;
  /** Pre-uploaded file token from POST /signatures/upload — sent to the form save API. */
  attachmentSignatureUrl?: string;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  /** Visit id — required to upload the attachment to /agent/attachments/upload. */
  visitId: number;
  primaryPhysician: string;
  referralBy: string;
  /** Previously-submitted referrals for this visit (newest first). */
  previousReferrals?: Referral[];
  onSave: (data: ReferralFormData) => void;
  t: (key: any) => string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ReferralForm({
  colors,
  isReadOnly,
  initialExpanded,
  visitId,
  primaryPhysician,
  referralBy,
  previousReferrals,
  onSave,
  t,
}: Props) {
  const { data: hospitals = [] } = useHospitals();

  const [open, setOpen] = useState(initialExpanded ?? false);
  const [referralDate, setReferralDate] = useState(todayIso());
  const [referralType, setReferralType] = useState<string | null>(null);
  const [referralHospitalName, setReferralHospitalName] = useState<string | null>(null);
  const [referralHospitalId, setReferralHospitalId] = useState<number | null>(null);
  const [printOptions, setPrintOptions] = useState<ReferralPrintOptions>(EMPTY_PRINT);
  const [referralReason, setReferralReason] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [comments, setComments] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | undefined>();
  const [attachmentUri, setAttachmentUri] = useState<string | undefined>();
  // Server-side attachment from existing referral (URL only — no local URI).
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);
  // Attachment uploaded to /agent/attachments/upload (referrals only). The
  // returned `fileName` is sent with the form save under the existing keys.
  const attachmentUpload = useAttachmentUpload(visitId, "referrals");

  // Seed form fields from the latest referral the first time data arrives.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    const latest = previousReferrals?.[0];
    if (!latest) return;
    seeded.current = true;
    setReferralDate(latest.referralDate || todayIso());
    setReferralType(latest.referralType || null);
    // Use the hospital name from the API response; fall back to our static list if needed.
    const hospitalName = latest.referralHospitalName ?? null;
    setReferralHospitalName(hospitalName);
    // Resolve the numeric id: prefer the value from the API, then look it up in the fetched list.
    const hospitalId =
      latest.referralHospitalId ??
      (hospitalName ? (hospitals.find(h => h.name === hospitalName)?.id ?? null) : null);
    setReferralHospitalId(hospitalId);
    setPrintOptions(latest.printOptions ?? EMPTY_PRINT);
    setReferralReason(latest.referralReason ?? "");
    setCompletionDate(latest.completionDate ?? "");
    setComments(latest.comments ?? "");
    if (latest.attachmentName) setAttachmentName(latest.attachmentName);
    if (latest.attachmentUrl) setExistingAttachmentUrl(latest.attachmentUrl);
  }, [previousReferrals]);

  // Hospital options from API + any name already saved on the referral not in the list.
  const hospitalOptions = useMemo(() => {
    const names = hospitals.map(h => h.name);
    if (referralHospitalName && !names.includes(referralHospitalName)) {
      names.push(referralHospitalName);
    }
    return names;
  }, [hospitals, referralHospitalName]);

  const setPrintOpt = (key: keyof ReferralPrintOptions, v: boolean) =>
    setPrintOptions((p) => ({ ...p, [key]: v }));

  const buildData = (): ReferralFormData => ({
    referralDate,
    referralType: referralType ?? "",
    otherReferralType: null,
    referralHospitalId: referralHospitalId ?? 0,
    printOptions,
    referralReason,
    completionDate,
    comments,
    status: "active",
    referralBy,
    primaryPhysician,
    attachmentUri,
    attachmentName,
    // Send the uploaded file name via the existing save key (unchanged contract).
    attachmentSignatureUrl: attachmentUpload.result?.fileName,
  });

  const canSave =
    referralType !== null &&
    referralHospitalId !== null &&
    referralReason.trim() !== "" &&
    !attachmentUpload.uploading;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(buildData());
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    seeded.current = false;
    setReferralDate(todayIso());
    setReferralType(null);
    setReferralHospitalName(null);
    setReferralHospitalId(null);
    setPrintOptions(EMPTY_PRINT);
    setReferralReason("");
    setCompletionDate("");
    setComments("");
    setAttachmentUri(undefined);
    setAttachmentName(undefined);
    setExistingAttachmentUrl(null);
    attachmentUpload.reset();
  };

  const pickAttachment = async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const name = asset.fileName ?? asset.uri.split("/").pop() ?? "attachment";
    setAttachmentUri(asset.uri);
    setAttachmentName(name);
    setExistingAttachmentUrl(null);

    // Upload immediately to /agent/attachments/upload so the form save only
    // needs the returned file name.
    await attachmentUpload.upload({
      uri:  asset.uri,
      name,
      mimeType: asset.mimeType,
    });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("referral")}
        icon="send"
        iconColor="#0891B2"
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody open={open} style={{ padding: 14, gap: 14 }} pointerEvents={isReadOnly ? "none" : "auto"}>
          {/* {previousReferrals && previousReferrals.length > 0 && (
            <PreviousReferralsSection referrals={previousReferrals} colors={colors} t={t} />
          )} */}

          <ReferralHeaderFields
            primaryPhysician={primaryPhysician}
            referralBy={referralBy}
            referralDate={referralDate}
            onReferralDateChange={setReferralDate}
            colors={colors}
            t={t}
          />

          <SelectField
            label={t("referralType")}
            value={referralType}
            options={REFERRAL_TYPES}
            placeholder={t("selectReferralType")}
            onChange={setReferralType}
          />

          <SelectField
            label={t("referralHospital")}
            value={referralHospitalName}
            options={hospitalOptions}
            placeholder={t("selectHospital")}
            onChange={(name) => {
              setReferralHospitalName(name);
              setReferralHospitalId(hospitals.find(h => h.name === name)?.id ?? null);
            }}
          />

          <PrintSection options={printOptions} onChange={setPrintOpt} colors={colors} t={t} />

          <View>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("referralReason")}</Text>
            <TextInput
              style={[
                s.formInput,
                { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, minHeight: 90, textAlignVertical: "top" },
              ]}
              value={referralReason}
              onChangeText={setReferralReason}
              placeholder={t("enterReferralReason")}
              placeholderTextColor={colors.textTertiary}
              multiline
              editable={!isReadOnly}
            />
          </View>

          <View style={s.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.formLabel, { color: colors.text }]}>{t("completionDate")}</Text>
              <DateTimeField
                mode="date"
                value={completionDate}
                onChange={setCompletionDate}
                colors={colors}
                editable={!isReadOnly}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.formLabel, { color: colors.text }]}>{t("comments")}</Text>
              <TextInput
                style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={comments}
                onChangeText={setComments}
                editable={!isReadOnly}
              />
            </View>
          </View>

          <AttachmentPicker
            fileName={attachmentName}
            fileUrl={attachmentUri ? undefined : existingAttachmentUrl ?? undefined}
            onPick={pickAttachment}
            onClear={() => {
              setAttachmentUri(undefined);
              setAttachmentName(undefined);
              setExistingAttachmentUrl(null);
              attachmentUpload.reset();
            }}
            uploading={attachmentUpload.uploading}
            uploadError={attachmentUpload.error}
            uploadedUrl={attachmentUpload.result?.fileUrl ?? null}
            colors={colors}
            t={t}
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              style={[s.saveFlowBtn, { backgroundColor: canSave ? Colors.primary : colors.border, flex: 1 }]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Feather name="save" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("save")}</Text>
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

function ReferralHeaderFields({
  primaryPhysician,
  referralBy,
  referralDate,
  onReferralDateChange,
  colors,
  t,
}: {
  primaryPhysician: string;
  referralBy: string;
  referralDate: string;
  onReferralDateChange: (v: string) => void;
  colors: any;
  t: (k: any) => string;
}) {
  return (
    <>
      <View>
        <Text style={[s.formLabel, { color: colors.text }]}>{t("referralDate")}</Text>
        <DateTimeField
          mode="date"
          value={referralDate}
          onChange={onReferralDateChange}
          colors={colors}
        />
      </View>
      <View style={s.formRow}>
        <ReadOnlyField label={t("primaryPhysician")} value={primaryPhysician} colors={colors} />
        <ReadOnlyField label={t("referralBy")} value={referralBy} colors={colors} />
      </View>
      <ReadOnlyField label={t("status")} value="Active" colors={colors} valueColor="#22C55E" />
    </>
  );
}

function ReadOnlyField({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <Text style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: valueColor ?? colors.textSecondary, paddingVertical: 8 }}>
        {value}
      </Text>
    </View>
  );
}

function PrintSection({
  options,
  onChange,
  colors,
  t,
}: {
  options: ReferralPrintOptions;
  onChange: (key: keyof ReferralPrintOptions, v: boolean) => void;
  colors: any;
  t: (k: any) => string;
}) {
  return (
    <View style={{ padding: 12, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLight }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.text, marginBottom: 8 }}>{t("print")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <View style={{ width: "50%" }}>
          <CheckboxField label={t("monthlyMedicalReport")} value={options.monthlyMedicalReport} onChange={(v) => onChange("monthlyMedicalReport", v)} />
          <CheckboxField label={t("labResult")} value={options.labResult} onChange={(v) => onChange("labResult", v)} />
        </View>
        <View style={{ width: "50%" }}>
          <CheckboxField label={t("systemMedicalReport")} value={options.systemMedicalReport} onChange={(v) => onChange("systemMedicalReport", v)} />
          <CheckboxField label={t("last3FlowSheets")} value={options.last3FlowSheets} onChange={(v) => onChange("last3FlowSheets", v)} />
        </View>
      </View>
    </View>
  );
}

function PreviousReferralsSection({
  referrals,
  colors,
  t,
}: {
  referrals: Referral[];
  colors: any;
  t: (k: any) => string;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.text }}>
        {t("previousReferrals") ?? "Previous Referrals"}
      </Text>
      {referrals.map((r) => (
        <PreviousReferralCard key={r.id} referral={r} colors={colors} t={t} />
      ))}
      <View style={{ height: 1, backgroundColor: colors.borderLight }} />
    </View>
  );
}

function PreviousReferralCard({
  referral,
  colors,
  t,
}: {
  referral: Referral;
  colors: any;
  t: (k: any) => string;
}) {
  const statusColor =
    referral.status === "active"
      ? "#22C55E"
      : referral.status === "in_progress"
      ? "#F59E0B"
      : referral.status === "closed"
      ? "#6B7280"
      : "#EF4444";

  const printLabels: { key: keyof ReferralPrintOptions; label: string }[] = [
    { key: "labResult", label: t("labResult") ?? "Lab Result" },
    { key: "last3FlowSheets", label: t("last3FlowSheets") ?? "Last 3 Flowsheets" },
    { key: "systemMedicalReport", label: t("systemMedicalReport") ?? "System Medical Report" },
    { key: "monthlyMedicalReport", label: t("monthlyMedicalReport") ?? "Monthly Medical Report" },
  ];
  const activePrint = printLabels.filter((p) => referral.printOptions[p.key]);

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
        gap: 8,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>
          {referral.referralType}
          {referral.referralHospitalName ? `  ·  ${referral.referralHospitalName}` : ""}
        </Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: `${statusColor}22` }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: statusColor, textTransform: "capitalize" }}>
            {referral.status.replace("_", " ")}
          </Text>
        </View>
      </View>

      {/* Date row */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        <InfoPair label={t("referralDate") ?? "Referral Date"} value={referral.referralDate} colors={colors} />
        {referral.completionDate ? (
          <InfoPair label={t("completionDate") ?? "Completion"} value={referral.completionDate} colors={colors} />
        ) : null}
      </View>

      {/* People row */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        {referral.referralBy ? (
          <InfoPair label={t("referralBy") ?? "Referred By"} value={referral.referralBy} colors={colors} />
        ) : null}
        {referral.primaryPhysician ? (
          <InfoPair label={t("primaryPhysician") ?? "Physician"} value={referral.primaryPhysician} colors={colors} />
        ) : null}
      </View>

      {/* Reason */}
      {referral.referralReason ? (
        <View>
          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
            {t("referralReason") ?? "Reason"}
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text }}>{referral.referralReason}</Text>
        </View>
      ) : null}

      {/* Comments */}
      {referral.comments ? (
        <View>
          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
            {t("comments") ?? "Comments"}
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text }}>{referral.comments}</Text>
        </View>
      ) : null}

      {/* Print options */}
      {activePrint.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {activePrint.map((p) => (
            <View
              key={p.key}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 20,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textSecondary }}>{p.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Attachment */}
      {referral.attachmentUrl && referral.attachmentName ? (
        <Pressable
          onPress={() => Linking.openURL(referral.attachmentUrl!)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Feather name="paperclip" size={13} color="#0891B2" />
          <Text
            style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#0891B2", textDecorationLine: "underline" }}
            numberOfLines={1}
          >
            {referral.attachmentName}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function InfoPair({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text }}>{value}</Text>
    </View>
  );
}

function AttachmentPicker({
  fileName,
  fileUrl,
  onPick,
  onClear,
  uploading,
  uploadError,
  uploadedUrl,
  colors,
  t,
}: {
  fileName?: string;
  /** Existing server-side URL shown as a tappable link when no local file is picked. */
  fileUrl?: string;
  onPick: () => void;
  onClear: () => void;
  /** True while the picked file is uploading to /signatures/upload. */
  uploading?: boolean;
  /** Error from the most recent upload attempt. */
  uploadError?: string | null;
  /** Absolute URL of the just-uploaded file (server response.full_url). */
  uploadedUrl?: string | null;
  colors: any;
  t: (k: any) => string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.formLabel, { color: colors.text }]}>{t("attachment")}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          onPress={onPick}
          disabled={uploading}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Feather name="paperclip" size={14} color={colors.text} />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>{t("chooseFiles")}</Text>
        </Pressable>
        <Text
          style={{ flex: 1, fontSize: 13, color: fileName ? colors.text : colors.textTertiary, fontFamily: "Inter_400Regular" }}
          numberOfLines={1}
        >
          {fileName ?? t("noFileChosen")}
        </Text>
        {uploading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : uploadedUrl ? (
          <Feather name="check-circle" size={16} color="#22C55E" />
        ) : null}
        {fileName && !uploading && (
          <Pressable onPress={onClear} style={{ padding: 4 }}>
            <Feather name="x" size={14} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {uploadError ? (
        <Text style={{ fontSize: 12, color: "#EF4444", fontFamily: "Inter_500Medium" }}>
          {uploadError}
        </Text>
      ) : null}

      {/* Just-uploaded file link */}
      {uploadedUrl && !uploading && (
        <Pressable
          onPress={() => Linking.openURL(uploadedUrl)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 2 }}
        >
          <Feather name="external-link" size={13} color="#22C55E" />
          <Text
            style={{ fontSize: 12, color: "#22C55E", fontFamily: "Inter_400Regular", textDecorationLine: "underline" }}
            numberOfLines={1}
          >
            {t("uploaded") ?? "Uploaded — view file"}
          </Text>
        </Pressable>
      )}

      {/* Show the existing server attachment as a tappable link */}
      {fileUrl && fileName && !uploadedUrl && (
        <Pressable
          onPress={() => Linking.openURL(fileUrl)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 2 }}
        >
          <Feather name="external-link" size={13} color="#0891B2" />
          <Text
            style={{ fontSize: 12, color: "#0891B2", fontFamily: "Inter_400Regular", textDecorationLine: "underline" }}
            numberOfLines={1}
          >
            {t("viewCurrentAttachment") ?? "View current attachment"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
