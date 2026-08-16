import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/theme/colors";
import { clock12hTo24h, clock24hTo12h, calculateDuration, formatElapsed } from "@/utils/time";

import { visitDetailStyles as s } from "./visit-detail.styles";
import { ReadOnlyField } from "./ReadOnlyField";

export type VisitPhase = "in_progress" | "start_procedure" | "end_procedure" | "completed" | "reopened";

interface Props {
  visitId?: number | string;
  visitDate?: string;
  visitTime?: string;
  visitStartTimeStr?: string;
  visitEndTimeStr?: string;
  procedureTime?: string;
  patientName?: string;
  hospital?: string;
  insurance?: string;
  provider?: string;
  doctorTime?: string;
  visitPhase: VisitPhase;
  rawStatus?: string;
  visitElapsed: number;
  procedureElapsed: number;
  procedureStartTimeStr: string;
  procedureEndTimeStr: string;
  showProcedureEdit: boolean;
  /** When false, hides the procedure time edit affordance entirely (app_settings: enable_toggle_procedure_button). */
  enableProcedureEdit?: boolean;
  /** User permission to edit procedure times. */
  canEditProcedure?: boolean;
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
  if (phase === "reopened") return "reopened";
  if (phase === "end_procedure") return "end procedure";
  if (phase === "start_procedure") return "start procedure";
  return "in progress";
}

export function VisitInfoCard(p: Props) {
  const { t } = useApp();
  const { colors, visitPhase, rawStatus } = p;
  // Only allow editing during procedure (not after it ends), and only if user has permission
  const procedureEditable = visitPhase === "start_procedure" && (p.canEditProcedure ?? true);
  const showProcedureEditIcon = (p.enableProcedureEdit ?? true) && procedureEditable;

  return (
    <Animated.View entering={FadeInDown.delay(70).springify()} style={s.section}>
      <Card style={s.sectionCard}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <ReadOnlyField label={t("visitId")} value={p.visitId != null && p.visitId !== "" ? `#${p.visitId}` : "—"} colors={colors} style={s.visitInfoCell} />
          <ReadOnlyField label={t("visitDate")} value={p.visitDate || "—"} colors={colors} style={s.visitInfoCell} />
          <View style={s.visitInfoCell}>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("procedureTime")}</Text>
            <Pressable
              style={[
                s.formInput,
                {
                  backgroundColor: colors.borderLight,
                  borderColor: colors.border,
                  flexDirection: "column",
                  gap: 6,
                },
              ]}
              onPress={() => {
                if (procedureEditable) p.onToggleProcedureEdit();
              }}
            >
              <Text style={{ color: colors.text }}>
                {p.procedureStartTimeStr !== "--:-- --" ? p.procedureStartTimeStr : (p.procedureTime || "—")}
                {p.procedureEndTimeStr !== "--:-- --" ? ` – ${p.procedureEndTimeStr}` : ""}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {visitPhase === "start_procedure" && p.procedureElapsed > 0 && (
                  <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#EF4444" }}>
                    {formatElapsed(p.procedureElapsed)}
                  </Text>
                )}
                {p.procedureStartTimeStr !== "--:-- --" && p.procedureEndTimeStr !== "--:-- --" && (visitPhase === "end_procedure" || visitPhase === "completed") && (
                  <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#EF4444" }}>
                    ({calculateDuration(p.procedureStartTimeStr, p.procedureEndTimeStr)})
                  </Text>
                )}
                {showProcedureEditIcon && <Feather name="edit-2" size={11} color={colors.textTertiary} />}
              </View>
            </Pressable>
          </View>
          <View style={s.visitInfoCell}>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("visitTimeLabel")}</Text>
            <Pressable
              style={[
                s.formInput,
                { backgroundColor: colors.borderLight, borderColor: colors.border, flexDirection: "column", gap: 6 },
              ]}
              onPress={() => {
                if (visitPhase !== "completed") {
                  Haptics.selectionAsync()
                  p.onToggleProcedureEdit()
                }
              }}
            >
              <Text style={{ color: colors.text }}>
                {p.visitStartTimeStr && p.visitStartTimeStr !== "--:-- --" ? p.visitStartTimeStr : (p.visitTime || "—")}
                {p.visitEndTimeStr && p.visitEndTimeStr !== "--:-- --" ? ` – ${p.visitEndTimeStr}` : ""}
              </Text>
              {visitPhase !== "completed" && p.visitElapsed > 0 && (
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#EF4444" }}>
                  {formatElapsed(p.visitElapsed)}
                </Text>
              )}
              {p.visitStartTimeStr && p.visitStartTimeStr !== "--:-- --" && p.visitEndTimeStr && p.visitEndTimeStr !== "--:-- --" && visitPhase === "completed" && (
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#EF4444" }}>
                  ({calculateDuration(p.visitStartTimeStr, p.visitEndTimeStr)})
                </Text>
              )}
            </Pressable>
          </View>
          <View style={s.visitInfoCell}>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("status")}</Text>
            <View style={[s.formInput, { backgroundColor: colors.borderLight, borderColor: colors.border, justifyContent: "center" }]}>
              <StatusBadge status={rawStatus === "in_active" ? rawStatus : statusLabel(visitPhase)} />
            </View>
          </View>
          <ReadOnlyField label={t("patient")} value={p.patientName || "—"} colors={colors} style={s.visitInfoCell} numberOfLines={1} />
          <ReadOnlyField label={t("hospital")} value={p.hospital || "—"} colors={colors} style={s.visitInfoCell} numberOfLines={1} />
          <ReadOnlyField label={t("insuranceGrant")} value={p.insurance || "N/A"} colors={colors} style={s.visitInfoCell} numberOfLines={1} />
          <ReadOnlyField label={t("providers")} value={p.provider || "—"} colors={colors} style={s.visitInfoCell} numberOfLines={1} />
          <View style={s.visitInfoCell}>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("doctorTime")}</Text>
            <View style={[s.formInput, { backgroundColor: colors.borderLight, borderColor: colors.border, justifyContent: "center" }]}>
              <Text style={{ color: p.doctorTime === "Not started" ? "#F59E0B" : colors.text }}>
                {p.doctorTime || "—"}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {p.showProcedureEdit && procedureEditable && (
        <Card style={[s.sectionCard, { marginTop: 12 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Feather name="clock" size={16} color={Colors.primary} />
            <Text style={[s.visitInfoValue, { color: colors.text }]}>{t("procedureTime")}: {p.procedureStartTimeStr}</Text>
            {p.procedureElapsed > 0 && (
              <Pressable onPress={() => Haptics.selectionAsync()}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#0EA5E9", textDecorationLine: "underline" }}>
                  {formatElapsed(p.procedureElapsed)}
                </Text>
              </Pressable>
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

function TimeInput({ label, value, onChangeText, editable, colors }: { label: string; value: string; onChangeText: (v: string) => void; editable: boolean; colors: any }) {
  // Same native time picker as the flow-sheet time fields. The picker works in
  // 24-hour `HH:mm`; procedure times are kept as 12-hour clock strings (what
  // the API wants), so convert at the boundary.
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <DateTimeField
        mode="time"
        value={clock12hTo24h(value)}
        onChange={(v) => onChangeText(clock24hTo12h(v))}
        editable={editable}
        colors={colors}
      />
    </View>
  );
}
