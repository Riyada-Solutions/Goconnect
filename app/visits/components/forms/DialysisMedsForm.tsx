import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import type { DialysisMedication } from "@/types/visit";
import { visitDetailStyles as s } from "../../visit-detail.styles";

export type MedAdminEntry = { status: "yes" | "no" | null; timestamp: string; reason: string };
export type MedAdminMap = Record<number, MedAdminEntry>;

interface Props {
  medications: DialysisMedication[];
  medAdmin: MedAdminMap;
  onAction: (medId: number, action: "yes" | "no") => void;
  colors: any;
}

export function DialysisMedsForm({ medications, medAdmin, onAction, colors }: Props) {
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
        const admin = medAdmin[med.id];
        return (
          <View key={med.id} style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>{med.drugName}</Text>
              {admin?.status && (
                <View
                  style={{
                    backgroundColor: admin.status === "yes" ? "#22C55E18" : "#EF444418",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: "Inter_600SemiBold",
                      color: admin.status === "yes" ? "#22C55E" : "#EF4444",
                    }}
                  >
                    {admin.status === "yes" ? "Administered" : "Not Given"}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              {med.dosage} — {med.route} — {med.frequency}
            </Text>
            {!admin?.status && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <Pressable onPress={() => onAction(med.id, "yes")} style={[s.medAdminBtn, { backgroundColor: "#22C55E" }]}>
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Yes</Text>
                </Pressable>
                <Pressable onPress={() => onAction(med.id, "no")} style={[s.medAdminBtn, { backgroundColor: "#EF4444" }]}>
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
