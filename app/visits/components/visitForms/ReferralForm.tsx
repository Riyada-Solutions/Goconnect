import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { SelectField } from "@/components/ui/SelectField";
import { Colors } from "@/theme/colors";
import {
  REFERRAL_HOSPITALS,
  REFERRAL_TYPES,
  type ReferralPrintOptions,
} from "@/data/models/referral";

import { visitDetailStyles as s } from "../../visit-detail.styles";
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
  referralHospital: string;
  printOptions: ReferralPrintOptions;
  referralReason: string;
  completionDate: string;
  comments: string;
  attachmentUri?: string;
  attachmentName?: string;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  primaryPhysician: string;
  referralBy: string;
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
  primaryPhysician,
  referralBy,
  onSave,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [referralDate, setReferralDate] = useState(todayIso());
  const [referralType, setReferralType] = useState<string | null>(null);
  const [referralHospital, setReferralHospital] = useState<string | null>(null);
  const [printOptions, setPrintOptions] = useState<ReferralPrintOptions>(EMPTY_PRINT);
  const [referralReason, setReferralReason] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [comments, setComments] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | undefined>();
  const [attachmentUri, setAttachmentUri] = useState<string | undefined>();

  const setPrintOpt = (key: keyof ReferralPrintOptions, v: boolean) =>
    setPrintOptions((p) => ({ ...p, [key]: v }));

  const buildData = (): ReferralFormData => ({
    referralDate,
    referralType: referralType ?? "",
    referralHospital: referralHospital ?? "",
    printOptions,
    referralReason,
    completionDate,
    comments,
    attachmentUri,
    attachmentName,
  });

  const canSave =
    referralType !== null &&
    referralHospital !== null &&
    referralReason.trim() !== "";

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(buildData());
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReferralDate(todayIso());
    setReferralType(null);
    setReferralHospital(null);
    setPrintOptions(EMPTY_PRINT);
    setReferralReason("");
    setCompletionDate("");
    setComments("");
    setAttachmentUri(undefined);
    setAttachmentName(undefined);
  };

  const pickAttachment = async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachmentUri(asset.uri);
      setAttachmentName(asset.fileName ?? asset.uri.split("/").pop() ?? "attachment");
    }
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
      {open && (
        <View style={{ padding: 14, gap: 14 }} pointerEvents={isReadOnly ? "none" : "auto"}>
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
            value={referralHospital}
            options={REFERRAL_HOSPITALS}
            placeholder={t("selectHospital")}
            onChange={setReferralHospital}
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
            onPick={pickAttachment}
            onClear={() => {
              setAttachmentUri(undefined);
              setAttachmentName(undefined);
            }}
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
        </View>
      )}
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

function AttachmentPicker({
  fileName,
  onPick,
  onClear,
  colors,
  t,
}: {
  fileName?: string;
  onPick: () => void;
  onClear: () => void;
  colors: any;
  t: (k: any) => string;
}) {
  return (
    <View>
      <Text style={[s.formLabel, { color: colors.text }]}>{t("attachment")}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          onPress={onPick}
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
        {fileName && (
          <Pressable onPress={onClear} style={{ padding: 4 }}>
            <Feather name="x" size={14} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
