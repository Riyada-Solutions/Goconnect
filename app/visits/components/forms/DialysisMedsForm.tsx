import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import type { FlowSheetDialysisMedication } from "@/data/models/flowSheet";
import { visitDetailStyles as s } from "../../visit-detail.styles";

/**
 * Mirrors the FlowSheetMedicationsInput.medAdmin shape (still used by the
 * unified flow-sheet save). The new per-row mutation reads/writes from
 * `med.administered` directly — this map is just for transient UI state.
 */
export type MedAdminEntry = { status: "yes" | "no" | null; timestamp: string; reason: string };
export type MedAdminMap = Record<number, MedAdminEntry>;

interface Props {
  medications: FlowSheetDialysisMedication[];
  medAdmin: MedAdminMap;
  /**
   * Triggered by Yes / No taps. For Yes, `reason` is undefined. For No, the
   * caller-provided reason string is passed through (UI prompts for it
   * inline before firing this).
   */
  onAction: (medId: number, action: "yes" | "no", reason?: string) => void;
  colors: any;
  /** Set of medication ids currently being saved — disables their buttons. */
  busyIds?: Set<number>;
}

/** Format an ISO timestamp like `2026-05-19T15:54:28+00:00` → `2026/05/19 03:54 PM`. */
function formatAdminWhen(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${date} ${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

export function DialysisMedsForm({ medications, medAdmin, onAction, colors, busyIds }: Props) {
  /** Tracks which row is currently in "enter reason for No" mode. */
  const [noReasonFor, setNoReasonFor] = useState<{ id: number; reason: string } | null>(null);

  if (medications.length === 0) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10, backgroundColor: "#E0F2FE", borderRadius: 6 }}>
        <Feather name="info" size={14} color="#0284C7" />
        <Text style={{ color: "#0284C7", fontSize: 12, fontFamily: "Inter_500Medium" }}>
          No dialysis medications found for this patient.
        </Text>
      </View>
    );
  }

  return (
    <>
      {medications.map((med) => {
        const medId = Number(med.id);
        const localAdmin = medAdmin[medId];
        const serverAdmin = med.administered;
        const isLockedYes = serverAdmin?.data?.action === 1;
        const isServerNo = serverAdmin?.data?.action === 0;
        const isBusy = !!busyIds?.has(medId);
        const isReasonMode = noReasonFor?.id === medId;
        const localPending = localAdmin?.status; // optimistic state before refetch

        return (
          <View key={med.id} style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            {/* Drug name + status pill */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>
                {med.drugName}
              </Text>
              {isLockedYes && (
                <View style={{ backgroundColor: "#22C55E18", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: "#16A34A" }}>YES</Text>
                </View>
              )}
              {isServerNo && (
                <View style={{ backgroundColor: "#EF444418", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: "#DC2626" }}>NO</Text>
                </View>
              )}
            </View>

            {/* Sub-line: dosage / route / frequency */}
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              {[med.dosage, med.route, med.frequency, med.administrationType].filter(Boolean).join(" — ")}
            </Text>

            {/* Locked Yes — show admin metadata (name + when), no buttons */}
            {isLockedYes && (
              <View style={{ marginTop: 8, padding: 8, backgroundColor: "#22C55E10", borderRadius: 8, gap: 2 }}>
                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#16A34A" }}>
                  @ {formatAdminWhen(serverAdmin?.created_at)}
                </Text>
                {serverAdmin?.action_by?.name ? (
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    {serverAdmin.action_by.name}
                    {serverAdmin.action_by.id != null ? ` (ID: ${serverAdmin.action_by.id})` : ""}
                  </Text>
                ) : null}
              </View>
            )}
            {/* Previous No reason (read-only) — buttons still available below to re-mark */}
            {!isLockedYes && isServerNo && serverAdmin?.data?.reason ? (
              <View style={{ marginTop: 8, padding: 8, backgroundColor: "#EF444410", borderRadius: 8, gap: 2 }}>
                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#DC2626" }}>
                  @ {formatAdminWhen(serverAdmin?.created_at)}
                </Text>
                {serverAdmin?.action_by?.name ? (
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    {serverAdmin.action_by.name}
                    {serverAdmin.action_by.id != null ? ` (ID: ${serverAdmin.action_by.id})` : ""}
                  </Text>
                ) : null}
                     <Text style={{ marginTop: 6, fontSize: 11, color: "#DC2626", fontFamily: "Inter_500Medium" }}>
                Reason: {serverAdmin.data.reason}
              </Text>
              </View>
            ) : null}



            {/* Inline reason input — appears after No is tapped */}
            {!isLockedYes && isReasonMode && (
              <View style={{ marginTop: 8, gap: 6 }}>
                <TextInput
                  value={noReasonFor.reason}
                  onChangeText={(t) => setNoReasonFor({ id: medId, reason: t })}
                  placeholder="Reason for not administering…"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={{
                    minHeight: 60,
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background ?? colors.surface,
                    color: colors.text,
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    textAlignVertical: "top",
                  }}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNoReasonFor(null);
                    }}
                    style={[s.medAdminBtn, { backgroundColor: "#9CA3AF", flex: 1 }]}
                  >
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const reason = noReasonFor.reason.trim();
                      if (!reason) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onAction(medId, "no", reason);
                      setNoReasonFor(null);
                    }}
                    disabled={!noReasonFor.reason.trim() || isBusy}
                    style={[
                      s.medAdminBtn,
                      {
                        backgroundColor: noReasonFor.reason.trim() ? "#EF4444" : "#FCA5A5",
                        flex: 1,
                        opacity: isBusy ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                      Confirm No
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Yes / No buttons */}
            {!isLockedYes && !isServerNo && !isReasonMode && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Pressable
                  onPress={() => {
                    if (isBusy) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onAction(medId, "yes");
                  }}
                  disabled={isBusy}
                  style={[s.medAdminBtn, { backgroundColor: "#22C55E", opacity: isBusy ? 0.7 : 1 }]}
                >
                  {isBusy && localPending === "yes" ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Yes</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (isBusy) return;
                    Haptics.selectionAsync();
                    setNoReasonFor({ id: medId, reason: serverAdmin?.data?.reason ?? "" });
                  }}
                  disabled={isBusy}
                  style={[s.medAdminBtn, { backgroundColor: "#EF4444", opacity: isBusy ? 0.7 : 1 }]}
                >
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>No</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}
