import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import { translations, type Language } from "@/config/i18n";
import {
  EMPTY_PARTY,
  EMPTY_RISKS,
  type PartyInfo,
  type RefusalRisks,
  type RefusalType,
} from "@/data/models/refusal";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { PartyInfoSection } from "./refusal/PartyInfoSection";
import { RefusalMainSection } from "./refusal/RefusalMainSection";

export interface RefusalFormSideData {
  types: RefusalType[];
  reason: string;
  risks: RefusalRisks;
  witness: PartyInfo;
  unableToSignReason: string;
  relative: PartyInfo;
  doctor: PartyInfo;
  interpreter: PartyInfo;
}

export interface RefusalFormData {
  en: RefusalFormSideData;
  ar: RefusalFormSideData;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  onSave: (data: RefusalFormData) => void;
  t: (key: any) => string;
}

const emptySide = (): RefusalFormSideData => ({
  types: [],
  reason: "",
  risks: { ...EMPTY_RISKS },
  witness: { ...EMPTY_PARTY },
  unableToSignReason: "",
  relative: { ...EMPTY_PARTY },
  doctor: { ...EMPTY_PARTY, relationship: undefined, address: undefined },
  interpreter: { ...EMPTY_PARTY, relationship: undefined, address: undefined },
});

const tFor = (lang: Language) => (key: keyof typeof translations.en): string => {
  const dict = translations[lang] as Record<string, string>;
  return dict[key] ?? translations.en[key] ?? String(key);
};

interface SideProps {
  lang: Language;
  data: RefusalFormSideData;
  setData: React.Dispatch<React.SetStateAction<RefusalFormSideData>>;
  colors: any;
}

function RefusalFormSide({ lang, data, setData, colors }: SideProps) {
  const t = tFor(lang);
  const isRtl = lang === "ar";
  const align = isRtl ? ("right" as const) : ("left" as const);
  const writingDirection = isRtl ? ("rtl" as const) : ("ltr" as const);

  const update = <K extends keyof RefusalFormSideData>(key: K, value: RefusalFormSideData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  return (
    <View style={{ gap: 16 }}>
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 15,
          color: colors.text,
          textAlign: align,
          writingDirection,
        }}
      >
        {t("refusalTitle")}
      </Text>

      <RefusalMainSection
        types={data.types}
        reason={data.reason}
        risks={data.risks}
        onTypesChange={(v) => update("types", v)}
        onReasonChange={(v) => update("reason", v)}
        onRisksChange={(v) => update("risks", v)}
        colors={colors}
        t={t}
        isRtl={isRtl}
      />

      <PartyInfoSection
        title={t("witnessInformation")}
        value={data.witness}
        onChange={(v) => update("witness", v)}
        showAddress
        signatureStatement={t("refusalWitnessStatement")}
        nameLabel={t("nameOfWitness")}
        relationshipLabel={t("relationship")}
        signatureLabel={t("signatureLabel")}
        dateTimeLabel={t("dateAndTime")}
        addressLabel={t("address")}
        selectRelationship={t("selectRelationship")}
        clickToSign={t("clickToSign")}
        signed={t("signedLabel")}
        colors={colors}
        isRtl={isRtl}
        lang={lang}
      />

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 14,
            color: "#0891B2",
            textAlign: align,
            writingDirection,
          }}
        >
          {t("reasonUnableToSign")}
        </Text>
        <Text style={[s.formLabel, { color: colors.text, textAlign: align, writingDirection }]}>
          {t("reasonLabel")}
        </Text>
        <TextInput
          style={[
            s.formInput,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              minHeight: 60,
              textAlignVertical: "top",
              textAlign: align,
              writingDirection,
            },
          ]}
          value={data.unableToSignReason}
          onChangeText={(v) => update("unableToSignReason", v)}
          multiline
        />
      </View>

      <PartyInfoSection
        title={t("relativeInformation")}
        value={data.relative}
        onChange={(v) => update("relative", v)}
        nameLabel={t("nameOfRelative")}
        relationshipLabel={t("relationship")}
        signatureLabel={t("signatureLabel")}
        dateTimeLabel={t("dateAndTime")}
        addressLabel={t("address")}
        selectRelationship={t("selectRelationship")}
        clickToSign={t("clickToSign")}
        signed={t("signedLabel")}
        colors={colors}
        isRtl={isRtl}
        lang={lang}
      />

      <PartyInfoSection
        title={t("doctorInformation")}
        value={data.doctor}
        onChange={(v) => update("doctor", v)}
        showRelationship={false}
        nameLabel={t("nameOfDoctor")}
        relationshipLabel={t("relationship")}
        signatureLabel={t("signatureLabel")}
        dateTimeLabel={t("dateAndTime")}
        addressLabel={t("address")}
        selectRelationship={t("selectRelationship")}
        clickToSign={t("clickToSign")}
        signed={t("signedLabel")}
        colors={colors}
        isRtl={isRtl}
        lang={lang}
      />

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: "Inter_700Bold",
            fontSize: 14,
            color: "#0891B2",
            textAlign: align,
            writingDirection,
          }}
        >
          {t("interpreterInformation")}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 18,
            textAlign: align,
            writingDirection,
          }}
        >
          {t("interpreterStatement")}
        </Text>
      </View>
      <PartyInfoSection
        title={t("interpreterInformation")}
        value={data.interpreter}
        onChange={(v) => update("interpreter", v)}
        showRelationship={false}
        nameLabel={t("nameOfInterpreter")}
        relationshipLabel={t("relationship")}
        signatureLabel={t("signatureLabel")}
        dateTimeLabel={t("dateAndTime")}
        addressLabel={t("address")}
        selectRelationship={t("selectRelationship")}
        clickToSign={t("clickToSign")}
        signed={t("signedLabel")}
        colors={colors}
        isRtl={isRtl}
        lang={lang}
      />
    </View>
  );
}

export function RefusalForm({ colors, isReadOnly, initialExpanded, onSave, t }: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [enData, setEnData] = useState<RefusalFormSideData>(emptySide());
  const [arData, setArData] = useState<RefusalFormSideData>(emptySide());

  const canSave =
    (enData.types.length > 0 && enData.reason.trim() !== "") ||
    (arData.types.length > 0 && arData.reason.trim() !== "");

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({ en: enData, ar: arData });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEnData(emptySide());
    setArData(emptySide());
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("refusalTitle")}
        icon="alert-octagon"
        iconColor="#DC2626"
        expanded={open}
        fontSize={14}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      {open && (
        <View style={{ padding: 14, gap: 20 }} pointerEvents={isReadOnly ? "none" : "auto"}>
          <RefusalFormSide lang="en" data={enData} setData={setEnData} colors={colors} />

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

          <RefusalFormSide lang="ar" data={arData} setData={setArData} colors={colors} />

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
