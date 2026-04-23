import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { useApp } from "@/context/AppContext";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleHeader, type CollapsibleBadge } from "../CollapsibleHeader";

export interface PatientAlertsData {
  allergies: { type: string; value: string }[];
  contamination: string[];
  instructions?: string | null;
  isolation?: string | null;
}

interface Props {
  alerts: PatientAlertsData;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
}

export function PatientAlertsCard({ alerts, expanded, onToggle, colors }: Props) {
  const { t } = useApp();
  const badges: CollapsibleBadge[] = [
    ...(alerts.allergies.length ? [{ text: String(alerts.allergies.length), bg: "#FEE2E2", fg: "#DC2626" }] : []),
    ...(alerts.contamination.length ? [{ text: String(alerts.contamination.length), bg: "#FEF3C7", fg: "#D97706" }] : []),
    ...(alerts.isolation ? [{ text: t("isolation"), bg: "#DBEAFE", fg: "#2563EB" }] : []),
  ];

  return (
    <Animated.View entering={FadeInDown.delay(80).springify()} style={s.section}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <CollapsibleHeader
          title={t("patientAlertsInstructions")}
          icon="alert-triangle"
          iconColor="#F59E0B"
          badges={badges}
          expanded={expanded}
          onToggle={onToggle}
          colors={colors}
        />
        {expanded && (
          <View style={{ padding: 12, gap: 10 }}>
            {(alerts.allergies.length > 0 || alerts.contamination.length > 0) && (
              <View style={[s.alertCard, { backgroundColor: "#FEF2F2", borderLeftColor: "#EF4444" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Feather name="alert-triangle" size={14} color="#DC2626" />
                  <Text style={s.alertCardTitle}>{t("allergiesContamination")}</Text>
                </View>
                {alerts.allergies.map((a, i) => (
                  <View key={i} style={s.alertRow}>
                    <MaterialCommunityIcons name="pill" size={14} color="#DC2626" />
                    <Text style={s.alertRowText}>
                      <Text style={{ fontFamily: "Inter_600SemiBold" }}>{a.type}:</Text> {a.value}
                    </Text>
                  </View>
                ))}
                {alerts.contamination.map((c, i) => (
                  <View key={`c-${i}`} style={s.alertRow}>
                    <MaterialCommunityIcons name="biohazard" size={14} color="#DC2626" />
                    <Text style={s.alertRowText}>
                      <Text style={{ fontFamily: "Inter_600SemiBold" }}>{t("contamination")}:</Text> {c}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {alerts.instructions ? (
              <View style={[s.alertCard, { backgroundColor: "#F59E0B18", borderLeftColor: "#F59E0B" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Feather name="file-text" size={14} color="#F59E0B" />
                  <Text style={[s.alertCardTitle, { color: "#F59E0B" }]}>{t("instructions").toUpperCase()}</Text>
                </View>
                <Text style={[s.alertInstrText, { color: colors.text }]}>{alerts.instructions}</Text>
              </View>
            ) : null}

            {alerts.isolation ? (
              <View style={[s.alertCard, { backgroundColor: "#3B82F618", borderLeftColor: "#3B82F6" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Feather name="shield" size={14} color="#3B82F6" />
                  <Text style={[s.alertCardTitle, { color: "#3B82F6" }]}>{t("isolation").toUpperCase()}</Text>
                </View>
                <Text style={[s.alertInstrText, { color: colors.text }]}>{t("isolation")} = {alerts.isolation}</Text>
              </View>
            ) : null}
          </View>
        )}
      </Card>
    </Animated.View>
  );
}
