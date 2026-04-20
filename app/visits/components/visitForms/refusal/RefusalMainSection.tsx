import React from "react";
import { Text, TextInput, View } from "react-native";

import { CheckboxField } from "@/components/ui/CheckboxField";
import type { RefusalRisks, RefusalType } from "@/types/refusal";

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
}: Props) {
  const toggleType = (type: RefusalType) => {
    onTypesChange(
      types.includes(type) ? types.filter((x) => x !== type) : [...types, type],
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={[s.formLabel, { color: colors.text }]}>{t("selectAppropriateBox")}</Text>
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

      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
        {t("refusalDisclaimer")}
      </Text>

      <View>
        <Text style={[s.formLabel, { color: colors.text }]}>{t("refusalReasonLabel")}</Text>
        <TextInput
          style={[
            s.formInput,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, minHeight: 80, textAlignVertical: "top" },
          ]}
          value={reason}
          onChangeText={onReasonChange}
          multiline
        />
      </View>

      <View>
        <Text style={[s.formLabel, { color: colors.text, marginBottom: 6 }]}>
          <Text style={{ fontFamily: "Inter_700Bold" }}>{t("risks")}</Text>
          {" — "}
          {t("risksExplained")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
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
        <Text style={[s.formLabel, { color: colors.text }]}>{t("othersPleaseSpecify")}</Text>
        <TextInput
          style={[
            s.formInput,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, minHeight: 60, textAlignVertical: "top" },
          ]}
          value={risks.others}
          onChangeText={(v) => onRisksChange({ ...risks, others: v })}
          multiline
        />
      </View>
    </View>
  );
}
