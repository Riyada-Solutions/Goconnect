import React from "react";
import { Text, TextInput, View } from "react-native";

import { CheckboxField } from "@/components/ui/CheckboxField";
import type { RefusalRisks, RefusalType } from "@/data/models/refusal";

import { visitDetailStyles as s } from "../../../visit-detail.styles";

interface Props {
  types: RefusalType[];
  reason: string;
  risks: RefusalRisks;
  onTypesChange: (types: RefusalType[]) => void;
  onReasonChange: (v: string) => void;
  onRisksChange: (r: RefusalRisks) => void;
  colors: any;
  t: (k: any) => string;
  isRtl?: boolean;
}

export function RefusalMainSection({
  types,
  reason,
  risks,
  onTypesChange,
  onReasonChange,
  onRisksChange,
  colors,
  t,
  isRtl = false,
}: Props) {
  const toggleType = (type: RefusalType) => {
    onTypesChange(
      types.includes(type) ? types.filter((x) => x !== type) : [...types, type],
    );
  };

  const align = isRtl ? ("right" as const) : ("left" as const);
  const writingDirection = isRtl ? ("rtl" as const) : ("ltr" as const);
  const labelStyle = [s.formLabel, { color: colors.text, textAlign: align, writingDirection }];
  const inputStyle = [
    s.formInput,
    {
      color: colors.text,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      minHeight: 80,
      textAlignVertical: "top" as const,
      textAlign: align,
      writingDirection,
    },
  ];

  return (
    <View style={{ gap: 12 }}>
      <Text style={labelStyle}>{t("selectAppropriateBox")}</Text>
      <View style={{ gap: 4 }}>
        <CheckboxField
          label={t("discontinuationOfServices")}
          value={types.includes("discontinuation")}
          onChange={() => toggleType("discontinuation")}
        />
        <CheckboxField
          label={t("refusalToConsent")}
          value={types.includes("refusal_consent")}
          onChange={() => toggleType("refusal_consent")}
        />
      </View>

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
        {t("refusalDisclaimer")}
      </Text>

      <View>
        <Text style={labelStyle}>{t("refusalReasonLabel")}</Text>
        <TextInput
          style={inputStyle}
          value={reason}
          onChangeText={onReasonChange}
          multiline
        />
      </View>

      <View>
        <Text style={[s.formLabel, { color: colors.text, marginBottom: 6, textAlign: align, writingDirection }]}>
          <Text style={{ fontFamily: "Inter_700Bold" }}>{t("risks")}</Text>
          {" — "}
          {t("risksExplained")}
        </Text>
        <View style={{ flexDirection: isRtl ? "row-reverse" : "row", flexWrap: "wrap" }}>
          <View style={{ width: "50%" }}>
            <CheckboxField label={t("hyperkalemia")} value={risks.hyperkalemia} onChange={(v) => onRisksChange({ ...risks, hyperkalemia: v })} />
            <CheckboxField label={t("pulmonaryEdema")} value={risks.pulmonaryEdema} onChange={(v) => onRisksChange({ ...risks, pulmonaryEdema: v })} />
          </View>
          <View style={{ width: "50%" }}>
            <CheckboxField label={t("cardiacArrest")} value={risks.cardiacArrest} onChange={(v) => onRisksChange({ ...risks, cardiacArrest: v })} />
            <CheckboxField label={t("severeAcidosis")} value={risks.severeAcidosis} onChange={(v) => onRisksChange({ ...risks, severeAcidosis: v })} />
          </View>
        </View>
      </View>

      <View>
        <Text style={labelStyle}>{t("othersPleaseSpecify")}</Text>
        <TextInput
          style={[
            s.formInput,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              minHeight: 60,
              textAlignVertical: "top" as const,
              textAlign: align,
              writingDirection,
            },
          ]}
          value={risks.others}
          onChangeText={(v) => onRisksChange({ ...risks, others: v })}
          multiline
        />
      </View>
    </View>
  );
}
