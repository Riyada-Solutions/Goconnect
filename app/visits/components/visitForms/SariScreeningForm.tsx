import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import {
  EMPTY_SARI_ACTIONS,
  EMPTY_SARI_EXPOSURE,
  EMPTY_SARI_FEATURES,
  type SariActionStatus,
  type SariActions,
  type SariAnswer,
  type SariExposure,
  type SariFeatures,
} from "@/data/models/sariScreening";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface SariScreeningFormData {
  addressographPatientName: string;
  dateTime: string;
  sariFeatures: SariFeatures;
  exposureCriteria: SariExposure;
  actions: SariActions;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  defaultPatientName?: string;
  onSave: (data: SariScreeningFormData) => void;
  t: (key: any) => string;
}

function nowIso(): string {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export function SariScreeningForm({
  colors,
  isReadOnly,
  initialExpanded,
  defaultPatientName,
  onSave,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [patientName, setPatientName] = useState(defaultPatientName ?? "");
  const [dateTime, setDateTime] = useState(nowIso());
  const [features, setFeatures] = useState<SariFeatures>(EMPTY_SARI_FEATURES);
  const [exposure, setExposure] = useState<SariExposure>(EMPTY_SARI_EXPOSURE);
  const [actions, setActions] = useState<SariActions>(EMPTY_SARI_ACTIONS);

  const canSave =
    patientName.trim() !== "" &&
    (features.fever !== null || features.coughOrBreathing !== null || features.radiographicEvidence !== null);

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      addressographPatientName: patientName,
      dateTime,
      sariFeatures: features,
      exposureCriteria: exposure,
      actions,
    });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPatientName(defaultPatientName ?? "");
    setDateTime(nowIso());
    setFeatures(EMPTY_SARI_FEATURES);
    setExposure(EMPTY_SARI_EXPOSURE);
    setActions(EMPTY_SARI_ACTIONS);
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("sariScreeningTool")}
        icon="shield"
        iconColor="#DC2626"
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      {open && (
        <View style={{ padding: 14, gap: 14 }} pointerEvents={isReadOnly ? "none" : "auto"}>
          <PhysiciansIntro colors={colors} t={t} />

          <View>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("sariAddressograph")}</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={patientName}
              onChangeText={setPatientName}
            />
          </View>

          <View>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("sariDateTime")}</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={dateTime}
              onChangeText={setDateTime}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <SectionBand title={t("sariScreeningBand")} colors={colors} />

          <YesNoRow
            label={t("sariFever")}
            value={features.fever}
            onChange={(v) => setFeatures({ ...features, fever: v })}
            colors={colors}
            t={t}
          />
          <YesNoRow
            label={t("sariCough")}
            value={features.coughOrBreathing}
            onChange={(v) => setFeatures({ ...features, coughOrBreathing: v })}
            colors={colors}
            t={t}
          />
          <YesNoRow
            label={t("sariRadiographic")}
            value={features.radiographicEvidence}
            onChange={(v) => setFeatures({ ...features, radiographicEvidence: v })}
            colors={colors}
            t={t}
          />
          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: "#DC2626" }}>
            {t("sariNoteIfAnyNo")}
          </Text>

          <SectionBand title={t("sariExposureBand")} colors={colors} />

          <YesNoRow label={t("sariExposure1a")} value={exposure.closeContactSari} onChange={(v) => setExposure({ ...exposure, closeContactSari: v })} colors={colors} t={t} />
          <YesNoRow label={t("sariExposure1b")} value={exposure.travelToPhacNotice} onChange={(v) => setExposure({ ...exposure, travelToPhacNotice: v })} colors={colors} t={t} />
          <YesNoRow label={t("sariExposure1c")} value={exposure.recentExposurePotentialSource} onChange={(v) => setExposure({ ...exposure, recentExposurePotentialSource: v })} colors={colors} t={t} />
          <YesNoRow label={t("sariExposure2")} value={exposure.inconsistentWithOtherKnownCause} onChange={(v) => setExposure({ ...exposure, inconsistentWithOtherKnownCause: v })} colors={colors} t={t} />

          <PrecautionGuide t={t} colors={colors} />

          <SectionBand title={t("sariActionsBand")} colors={colors} />

          <ActionRow label={t("sariAction1")} value={actions.thinkInfectionControl} onChange={(v) => setActions({ ...actions, thinkInfectionControl: v })} colors={colors} t={t} />
          <ActionRow label={t("sariAction2")} value={actions.tellMedicalHealthOfficer} onChange={(v) => setActions({ ...actions, tellMedicalHealthOfficer: v })} colors={colors} t={t} />
          <ActionRow label={t("sariAction3")} value={actions.tellInfectionControl} onChange={(v) => setActions({ ...actions, tellInfectionControl: v })} colors={colors} t={t} />
          <ActionRow label={t("sariAction4")} value={actions.consultInfectiousDiseaseSpecialist} onChange={(v) => setActions({ ...actions, consultInfectiousDiseaseSpecialist: v })} colors={colors} t={t} />
          <ActionRow label={t("sariAction5")} value={actions.test} onChange={(v) => setActions({ ...actions, test: v })} colors={colors} t={t} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              style={[s.saveFlowBtn, { backgroundColor: canSave ? Colors.primary : colors.border, flex: 1 }]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Feather name="save" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("save")}</Text>
            </Pressable>
            <Pressable
              style={[s.saveFlowBtn, { backgroundColor: "#EF4444", flex: 1 }]}
              onPress={handleClear}
            >
              <Feather name="trash-2" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("clear")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Card>
  );
}

function PhysiciansIntro({ colors, t }: { colors: any; t: (k: any) => string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#DC2626", letterSpacing: 0.5 }}>
        {t("sariPhysiciansToComplete")}
      </Text>
      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
        {t("sariIntro1")}
      </Text>
      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary, lineHeight: 16 }}>
        {t("sariIntro2")}
      </Text>
    </View>
  );
}

function SectionBand({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={{ backgroundColor: colors.textSecondary + "30", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: colors.text, textAlign: "center", letterSpacing: 0.5 }}>
        {title}
      </Text>
    </View>
  );
}

function YesNoRow({
  label,
  value,
  onChange,
  colors,
  t,
}: {
  label: string;
  value: SariAnswer;
  onChange: (v: SariAnswer) => void;
  colors: any;
  t: (k: any) => string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 4 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.text, lineHeight: 18 }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Radio label={t("yes")} selected={value === "yes"} onPress={() => onChange("yes")} color={Colors.primary} colors={colors} />
        <Radio label={t("no")} selected={value === "no"} onPress={() => onChange("no")} color="#EF4444" colors={colors} />
      </View>
    </View>
  );
}

function ActionRow({
  label,
  value,
  onChange,
  colors,
  t,
}: {
  label: string;
  value: SariActionStatus;
  onChange: (v: SariActionStatus) => void;
  colors: any;
  t: (k: any) => string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 4 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.text, lineHeight: 18 }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Radio label={t("sariDone")} selected={value === "done"} onPress={() => onChange("done")} color="#22C55E" colors={colors} />
        <Radio label={t("sariNotDone")} selected={value === "not_done"} onPress={() => onChange("not_done")} color="#EF4444" colors={colors} />
      </View>
    </View>
  );
}

function Radio({
  label,
  selected,
  onPress,
  color,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color: string;
  colors: any;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: selected ? color : colors.border,
        backgroundColor: selected ? `${color}15` : "transparent",
      }}
    >
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: selected ? color : colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />}
      </View>
      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: selected ? color : colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

function PrecautionGuide({ t, colors }: { t: (k: any) => string; colors: any }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ backgroundColor: "#DBEAFE", borderRadius: 10, padding: 12 }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#1E40AF", marginBottom: 4 }}>
          {t("sariPrecautionNo")}
        </Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#1E3A8A", lineHeight: 16 }}>
          {t("sariPrecautionNoDetail")}
        </Text>
      </View>
      <View style={{ backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12 }}>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#991B1B", marginBottom: 4 }}>
          {t("sariPrecautionYes")}
        </Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#7F1D1D", lineHeight: 16 }}>
          {t("sariPrecautionYesDetail")}
        </Text>
      </View>
    </View>
  );
}
