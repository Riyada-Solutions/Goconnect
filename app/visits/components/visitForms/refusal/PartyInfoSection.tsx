import React, { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { ClickToSignButton } from "@/components/ui/ClickToSignButton";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { SelectField } from "@/components/ui/SelectField";
import { useApp } from "@/context/AppContext";
import { translations } from "@/config/i18n";
import { RELATIONSHIP_OPTIONS, type PartyInfo } from "@/data/models/refusal";

import { visitDetailStyles as s } from "../../../visit-detail.styles";
import { SignatureConfirmSheet } from "./SignatureConfirmSheet";

const RELATIONSHIP_KEYS: Record<(typeof RELATIONSHIP_OPTIONS)[number], string> = {
  Father: "relationshipFather",
  Mother: "relationshipMother",
  Spouse: "relationshipSpouse",
  Son: "relationshipSon",
  Daughter: "relationshipDaughter",
  Brother: "relationshipBrother",
  Sister: "relationshipSister",
  Guardian: "relationshipGuardian",
  Other: "relationshipOther",
};

interface Props {
  title: string;
  value: PartyInfo;
  onChange: (v: PartyInfo) => void;
  showRelationship?: boolean;
  showAddress?: boolean;
  signatureStatement?: string;
  nameLabel: string;
  relationshipLabel: string;
  signatureLabel: string;
  dateTimeLabel: string;
  addressLabel: string;
  selectRelationship: string;
  clickToSign: string;
  signed: string;
  colors: any;
  isRtl?: boolean;
  lang?: "en" | "ar";
}

export function PartyInfoSection({
  title,
  value,
  onChange,
  showRelationship = true,
  showAddress = false,
  signatureStatement,
  nameLabel,
  relationshipLabel,
  signatureLabel,
  dateTimeLabel,
  addressLabel,
  selectRelationship,
  clickToSign,
  signed,
  colors,
  isRtl = false,
  lang,
}: Props) {
  const { t } = useApp();
  const [signatureOpen, setSignatureOpen] = useState(false);
  const relationshipOptions = useMemo(
    () =>
      RELATIONSHIP_OPTIONS.map((opt) => {
        const key = RELATIONSHIP_KEYS[opt] as keyof typeof translations.en;
        const label = lang
          ? (translations[lang] as Record<string, string>)[key] ?? translations.en[key] ?? opt
          : t(key as any);
        return { value: opt, label };
      }),
    [t, lang],
  );

  const labelStyle = [
    s.formLabel,
    { color: colors.text, textAlign: isRtl ? ("right" as const) : ("left" as const), writingDirection: isRtl ? ("rtl" as const) : ("ltr" as const) },
  ];
  const inputStyle = [
    s.formInput,
    {
      color: colors.text,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      textAlign: isRtl ? ("right" as const) : ("left" as const),
      writingDirection: isRtl ? ("rtl" as const) : ("ltr" as const),
    },
  ];

  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 14,
          color: "#0891B2",
          textAlign: isRtl ? "right" : "left",
          writingDirection: isRtl ? "rtl" : "ltr",
        }}
      >
        {title}
      </Text>

      <View>
        <Text style={labelStyle}>{nameLabel}</Text>
        <TextInput
          style={inputStyle}
          value={value.name}
          onChangeText={(v) => onChange({ ...value, name: v })}
        />
      </View>

      <View style={[s.formRow, isRtl ? { flexDirection: "row-reverse" } : null]}>
        {showRelationship ? (
          <View style={{ flex: 1 }}>
            <SelectField
              label={relationshipLabel}
              value={value.relationship ?? null}
              options={relationshipOptions}
              placeholder={selectRelationship}
              onChange={(v) => onChange({ ...value, relationship: v })}
            />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={labelStyle}>{signatureLabel}</Text>
          <ClickToSignButton
            signed={value.signed}
            signedAt={value.signedAt}
            signedLabel={signed}
            unsignedLabel={clickToSign}
            onPress={() => setSignatureOpen(true)}
          />
        </View>
      </View>

      <View>
        <Text style={labelStyle}>{dateTimeLabel}</Text>
        <DateTimeField
          mode="datetime"
          value={value.signedAt ?? ""}
          onChange={(v) => onChange({ ...value, signedAt: v })}
          colors={colors}
          isRtl={isRtl}
        />
      </View>

      {showAddress ? (
        <View>
          <Text style={labelStyle}>{addressLabel}</Text>
          <TextInput
            style={inputStyle}
            value={value.address ?? ""}
            onChangeText={(v) => onChange({ ...value, address: v })}
          />
        </View>
      ) : null}

      <SignatureConfirmSheet
        visible={signatureOpen}
        title={title}
        subtitle={value.name || undefined}
        statement={signatureStatement}
        initialSignature={
          value.signed
            ? value.signatureData ?? value.signatureUrl ?? undefined
            : undefined
        }
        onConfirm={(signatureData) => {
          onChange({
            ...value,
            signed: true,
            signedAt: new Date().toISOString(),
            signatureData,
          });
          setSignatureOpen(false);
        }}
        onClose={() => setSignatureOpen(false)}
        colors={colors}
      />
    </View>
  );
}
