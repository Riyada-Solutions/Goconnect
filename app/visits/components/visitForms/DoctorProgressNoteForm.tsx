import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import type {
  DoctorProgressNote,
  DoctorProgressNoteVitals,
} from "@/data/models/doctorProgressNote";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { ProgressNoteItem } from "./ProgressNoteItem";

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  /** When true, render without the outer Card + CollapsibleHeader. */
  embedded?: boolean;
  vitals?: DoctorProgressNoteVitals;
  previousNotes: DoctorProgressNote[];
  onSave: (input: { note: string; isAddendum: boolean; parentNoteId?: number }) => void;
  t: (key: any) => string;
}

export function DoctorProgressNoteForm({
  colors,
  isReadOnly,
  initialExpanded,
  embedded,
  vitals,
  previousNotes,
  onSave,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [currentNote, setCurrentNote] = useState("");
  const [isAddendum, setIsAddendum] = useState(false);

  const latestNoteId = previousNotes[0]?.id;
  const canAddendum = !!latestNoteId;

  const handleSave = () => {
    if (!currentNote.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      note: currentNote.trim(),
      isAddendum: isAddendum && canAddendum,
      parentNoteId: isAddendum && canAddendum ? latestNoteId : undefined,
    });
    setCurrentNote("");
    setIsAddendum(false);
  };

  const done = previousNotes.length > 0 || currentNote.trim() !== "";

  const body = (
    <View style={{  gap: 14 }} pointerEvents={isReadOnly ? "none" : "auto"}>
          <PreTreatmentVitalsSection vitals={vitals} colors={colors} t={t} />

          <View>
            <Text style={[s.formLabel, { color: colors.text, marginBottom: 6, fontSize: 13 }]}>
              {t("currentProgressNotes")}
            </Text>
            <Text style={[s.formLabel, { color: colors.text, marginBottom: 8 }]}>
              {t("previousProgressNotes")}
            </Text>
            {previousNotes.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                {t("noPreviousNotes")}
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {previousNotes.map((n) => (
                  <ProgressNoteItem
                    key={n.id}
                    author={n.author + (n.isAddendum ? ` — ${t("addendum")}` : "")}
                    note={n.note}
                    createdAt={n.createdAt}
                    copyLabel={t("copy")}
                    onCopy={() => {
                      Haptics.selectionAsync();
                      setCurrentNote(n.note);
                    }}
                    colors={colors}
                  />
                ))}
              </View>
            )}
          </View>

          <View>
            <TextInput
              style={[
                s.formInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  minHeight: 120,
                  textAlignVertical: "top",
                },
              ]}
              value={currentNote}
              onChangeText={setCurrentNote}
              placeholder={t("enterProgressNotes")}
              placeholderTextColor={colors.textTertiary}
              multiline
              editable={!isReadOnly}
            />
            <Pressable
              onPress={() => {
                if (!canAddendum) return;
                Haptics.selectionAsync();
                setIsAddendum((v) => !v);
              }}
              disabled={!canAddendum}
              style={{
                alignSelf: "flex-start",
                marginTop: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: isAddendum ? Colors.primary : colors.border,
                backgroundColor: isAddendum ? `${Colors.primary}15` : "transparent",
                opacity: canAddendum ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                  color: isAddendum ? Colors.primary : colors.textSecondary,
                }}
              >
                {t("addendum")}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[s.saveFlowBtn, { backgroundColor: currentNote.trim() ? Colors.primary : colors.border }]}
            onPress={handleSave}
            disabled={!currentNote.trim()}
          >
            <Feather name="save" size={16} color="#fff" />
            <Text style={s.mainBtnText}>{t("save")}</Text>
          </Pressable>
    </View>
  );

  if (embedded) return body;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("doctorProgressNote")}
        icon="activity"
        iconColor="#DC2626"
        badges={done ? [{ text: String(previousNotes.length), bg: "#FEE2E2", fg: "#DC2626" }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      {open && body}
    </Card>
  );
}

function PreTreatmentVitalsSection({
  vitals,
  colors,
  t,
}: {
  vitals?: DoctorProgressNoteVitals;
  colors: any;
  t: (k: any) => string;
}) {
  const rows: { label: string; value?: string }[] = [
    { label: `${t("temperature")}:`, value: vitals?.temperature },
    { label: `${t("respiratoryRate")}:`, value: vitals?.respiratoryRate },
    { label: `${t("oxygenSaturation")}:`, value: vitals?.oxygenSaturation },
    { label: `${t("bloodPressure")}:`, value: vitals?.bloodPressure },
    { label: `${t("pulseRate")}:`, value: vitals?.pulseRate },
    { label: `${t("preWeightKg")}:`, value: vitals?.preWeight },
    { label: `${t("dryWeightKg")}:`, value: vitals?.dryWeight },
    { label: `${t("ufGoalL")}:`, value: vitals?.ufGoal },
    { label: `${t("rbsMgDl")}:`, value: vitals?.rbs },
  ];

  return (
    <View style={{ padding: 12, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLight }}>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#DC2626", marginBottom: 10 }}>
        {t("preTreatmentVitals")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {rows.map((row) => (
          <View key={row.label} style={{ width: "33.33%", paddingVertical: 6, paddingRight: 6 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
                backgroundColor: colors.surface,
              }}
            >
              <Text
                style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.textSecondary, flex: 1 }}
                numberOfLines={1}
              >
                {row.label}
              </Text>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text, marginLeft: 4 }}>
                {row.value && row.value.trim() !== "" ? row.value : "—"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
