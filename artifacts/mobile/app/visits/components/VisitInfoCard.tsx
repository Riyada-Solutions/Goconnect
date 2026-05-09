import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/theme/colors";
import { formatElapsed } from "@/utils/time";

import { visitDetailStyles as s } from "../visit-detail.styles";

export type VisitPhase = "in_progress" | "start_procedure" | "end_procedure" | "completed";

interface Props {
  visitDate?: string;
  visitTime?: string;
  procedureTime?: string;
  patientName?: string;
  hospital?: string;
  insurance?: string;
  provider?: string;
  doctorTime?: string;
  visitPhase: VisitPhase;
  visitElapsed: number;
  procedureElapsed: number;
  procedureStartTimeStr: string;
  procedureEndTimeStr: string;
  showProcedureEdit: boolean;
  editProcStart: string;
  editProcEnd: string;
  isReadOnly: boolean;
  colors: any;
  onToggleProcedureEdit: () => void;
  onEditProcStartChange: (v: string) => void;
  onEditProcEndChange: (v: string) => void;
  onSaveProcedureTimes: () => void;
}

function statusLabel(phase: VisitPhase): string {
  if (phase === "completed") return "completed";
  if (phase === "end_procedure") return "end procedure";
  if (phase === "start_procedure") return "start procedure";
  return "in progress";
}

export function VisitInfoCard(p: Props) {
  const { t } = useApp();
  const { colors, visitPhase } = p;
  const procedureEditable = visitPhase === "start_procedure" || visitPhase === "end_procedure";

  return (
    <Animated.View entering={FadeInDown.delay(70).springify()} style={s.section}>
      <Card style={s.sectionCard}>
        <View style={s.visitInfoGrid}>
          <InfoCell label={t("visitDate")} value={p.visitDate || "—"} colors={colors} />
          <View style={s.visitInfoCell}>
            <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>{t("procedureTime")}</Text>
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}
              onPress={() => {
                if (procedureEditable) p.onToggleProcedureEdit();
              }}
            >
              <Text style={[s.visitInfoValue, { color: colors.text }]}>
                {p.procedureStartTimeStr !== "--:-- --" ? p.procedureStartTimeStr : (p.procedureTime || "—")}
                {p.procedureEndTimeStr !== "--:-- --" ? ` – ${p.procedureEndTimeStr}` : ""}
              </Text>
              {procedureEditable && p.procedureElapsed > 0 && (
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#22C55E" }}>
                  {formatElapsed(p.procedureElapsed)}
                </Text>
              )}
              {procedureEditable && <Feather name="edit-2" size={11} color={colors.textTertiary} />}
            </Pressable>
          </View>
          <View style={s.visitInfoCell}>
            <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>{t("visitTimeLabel")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={[s.visitInfoValue, { color: colors.text }]}>{p.visitTime || "—"}</Text>
              {p.visitElapsed > 0 && (
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#DC2626" }}>
                  {formatElapsed(p.visitElapsed)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={[s.visitInfoDivider, { backgroundColor: colors.borderLight }]} />

        <View style={s.visitInfoGrid}>
          <View style={s.visitInfoCell}>
            <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>{t("status")}</Text>
            <StatusBadge status={statusLabel(visitPhase)} />
          </View>
          <InfoCell label={t("patient")} value={p.patientName || "—"} colors={colors} />
          <InfoCell label={t("hospital")} value={p.hospital || "—"} colors={colors} />
        </View>

        <View style={[s.visitInfoDivider, { backgroundColor: colors.borderLight }]} />

        <View style={s.visitInfoGrid}>
          <InfoCell label={t("insuranceGrant")} value={p.insurance || "N/A"} colors={colors} />
          <InfoCell label={t("providers")} value={p.provider || "—"} colors={colors} />
          <View style={s.visitInfoCell}>
            <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>{t("doctorTime")}</Text>
            <Text style={[s.visitInfoValue, { color: p.doctorTime === "Not started" ? "#F59E0B" : colors.text }]}>
              {p.doctorTime || "—"}
            </Text>
          </View>
        </View>
      </Card>

      {p.showProcedureEdit && (
        <Card style={[s.sectionCard, { marginTop: 12 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Feather name="clock" size={16} color={Colors.primary} />
            <Text style={[s.visitInfoValue, { color: colors.text }]}>{t("procedureTime")}: {p.procedureStartTimeStr}</Text>
            {p.procedureElapsed > 0 && (
              <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#22C55E" }}>
                {formatElapsed(p.procedureElapsed)}
              </Text>
            )}
            <Pressable onPress={p.onToggleProcedureEdit} style={{ marginLeft: "auto" }}>
              <Feather name="edit-2" size={14} color={Colors.primary} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TimeInput label={t("start")} value={p.editProcStart} onChangeText={p.onEditProcStartChange} editable={!p.isReadOnly} colors={colors} />
            <TimeInput label={t("end")} value={p.editProcEnd} onChangeText={p.onEditProcEndChange} editable={!p.isReadOnly} colors={colors} />
          </View>

          {!p.isReadOnly && (
            <Pressable
              style={[s.procSaveBtn, { backgroundColor: Colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                p.onSaveProcedureTimes();
              }}
            >
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{t("save")}</Text>
            </Pressable>
          )}
        </Card>
      )}
    </Animated.View>
  );
}

function InfoCell({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={s.visitInfoCell}>
      <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[s.visitInfoValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function TimeInput({ label, value, onChangeText, editable, colors }: { label: string; value: string; onChangeText: (v: string) => void; editable: boolean; colors: any }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <View style={[s.procTimeInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          style={[s.procTimeText, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder="--:-- --"
          placeholderTextColor={colors.textTertiary}
          editable={editable}
        />
        <Feather name="clock" size={16} color={colors.textTertiary} />
      </View>
    </View>
  );
}
