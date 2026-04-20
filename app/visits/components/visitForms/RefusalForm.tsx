import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import {
  EMPTY_PARTY,
  EMPTY_RISKS,
  type PartyInfo,
  type RefusalRisks,
  type RefusalType,
} from "@/types/refusal";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { PartyInfoSection } from "./refusal/PartyInfoSection";
import { RefusalMainSection } from "./refusal/RefusalMainSection";

export interface RefusalFormData {
  types: RefusalType[];
  reason: string;
  risks: RefusalRisks;
  witness: PartyInfo;
  unableToSignReason: string;
  relative: PartyInfo;
  doctor: PartyInfo;
  interpreter: PartyInfo;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  onSave: (data: RefusalFormData) => void;
  onPrint: (data: RefusalFormData) => void;
  t: (key: any) => string;
}

export function RefusalForm({ colors, isReadOnly, initialExpanded, onSave, onPrint, t }: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [types, setTypes] = useState<RefusalType[]>([]);
  const [reason, setReason] = useState("");
  const [risks, setRisks] = useState<RefusalRisks>({ ...EMPTY_RISKS });
  const [witness, setWitness] = useState<PartyInfo>({ ...EMPTY_PARTY });
  const [unableToSignReason, setUnableToSignReason] = useState("");
  const [relative, setRelative] = useState<PartyInfo>({ ...EMPTY_PARTY });
  const [doctor, setDoctor] = useState<PartyInfo>({ ...EMPTY_PARTY, relationship: undefined, address: undefined });
  const [interpreter, setInterpreter] = useState<PartyInfo>({ ...EMPTY_PARTY, relationship: undefined, address: undefined });

  const canSave = types.length > 0 && reason.trim() !== "";

  const buildData = (): RefusalFormData => ({
    types, reason, risks, witness, unableToSignReason, relative, doctor, interpreter,
  });

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(buildData());
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTypes([]);
    setReason("");
    setRisks({ ...EMPTY_RISKS });
    setWitness({ ...EMPTY_PARTY });
    setUnableToSignReason("");
    setRelative({ ...EMPTY_PARTY });
    setDoctor({ ...EMPTY_PARTY, relationship: undefined, address: undefined });
    setInterpreter({ ...EMPTY_PARTY, relationship: undefined, address: undefined });
  };

  const handlePrint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPrint(buildData());
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
        <View style={{ padding: 14, gap: 16 }} pointerEvents={isReadOnly ? "none" : "auto"}>
          <RefusalMainSection
            types={types}
            reason={reason}
            risks={risks}
            onTypesChange={setTypes}
            onReasonChange={setReason}
            onRisksChange={setRisks}
            colors={colors}
            t={t}
          />

          <PartyInfoSection
            title={t("witnessInformation")}
            value={witness}
            onChange={setWitness}
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
          />

          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#0891B2" }}>
              {t("reasonUnableToSign")}
            </Text>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("reasonLabel")}</Text>
            <TextInput
              style={[
                s.formInput,
                { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, minHeight: 60, textAlignVertical: "top" },
              ]}
              value={unableToSignReason}
              onChangeText={setUnableToSignReason}
              multiline
            />
          </View>

          <PartyInfoSection
            title={t("relativeInformation")}
            value={relative}
            onChange={setRelative}
            nameLabel={t("nameOfRelative")}
            relationshipLabel={t("relationship")}
            signatureLabel={t("signatureLabel")}
            dateTimeLabel={t("dateAndTime")}
            addressLabel={t("address")}
            selectRelationship={t("selectRelationship")}
            clickToSign={t("clickToSign")}
            signed={t("signedLabel")}
            colors={colors}
          />

          <PartyInfoSection
            title={t("doctorInformation")}
            value={doctor}
            onChange={setDoctor}
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
          />

          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#0891B2" }}>
              {t("interpreterInformation")}
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
              {t("interpreterStatement")}
            </Text>
          </View>
          <PartyInfoSection
            title={t("interpreterInformation")}
            value={interpreter}
            onChange={setInterpreter}
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
            <Pressable style={[s.saveFlowBtn, { backgroundColor: "#F59E0B", flex: 1 }]} onPress={handlePrint}>
              <Feather name="printer" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("print")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Card>
  );
}
