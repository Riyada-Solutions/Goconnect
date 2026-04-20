import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { ClickToSignButton } from "@/components/ui/ClickToSignButton";
import { SelectField } from "@/components/ui/SelectField";
import { RELATIONSHIP_OPTIONS, type PartyInfo } from "@/types/refusal";

import { visitDetailStyles as s } from "../../../visit-detail.styles";
import { SignatureConfirmSheet } from "./SignatureConfirmSheet";

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
}: Props) {
  const [signatureOpen, setSignatureOpen] = useState(false);

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#0891B2" }}>{title}</Text>

      <View>
        <Text style={[s.formLabel, { color: colors.text }]}>{nameLabel}</Text>
        <TextInput
          style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          value={value.name}
          onChangeText={(v) => onChange({ ...value, name: v })}
        />
      </View>

      <View style={s.formRow}>
        {showRelationship ? (
          <View style={{ flex: 1 }}>
            <SelectField
              label={relationshipLabel}
              value={value.relationship ?? null}
              options={RELATIONSHIP_OPTIONS}
              placeholder={selectRelationship}
              onChange={(v) => onChange({ ...value, relationship: v })}
            />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[s.formLabel, { color: colors.text }]}>{signatureLabel}</Text>
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
        <Text style={[s.formLabel, { color: colors.text }]}>{dateTimeLabel}</Text>
        <TextInput
          style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          value={value.signedAt ?? ""}
          onChangeText={(v) => onChange({ ...value, signedAt: v })}
          placeholder="YYYY-MM-DD HH:mm"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {showAddress ? (
        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>{addressLabel}</Text>
          <TextInput
            style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
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
