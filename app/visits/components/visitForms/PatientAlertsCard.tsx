import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { useApp } from "@/context/AppContext";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader, type CollapsibleBadge } from "../CollapsibleHeader";

export interface IsolationInfo {
  value: string;
  label?: string;
  description?: string;
  /** Semantic colour name from the backend: `success` | `warning` | `danger` | `info` | `primary`. */
  color?: string;
  /** Font Awesome class string (e.g. `"fas fa-check-circle"`) — currently unused on mobile. */
  icon?: string;
}

export interface PatientAlertsData {
  allergies: { type: string; value: string }[];
  contamination: string[];
  /** Backend sometimes ships a bare string, sometimes an object with `label`/`value`. */
  instructions?: string | { label?: string; value?: string; description?: string } | null;
  /** Backend ships an object; older payloads used a bare string label. */
  isolation?: IsolationInfo | string | null;
}

interface Props {
  alerts: PatientAlertsData;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
}

/** Normalize string-or-object isolation into a single shape for rendering. */
function readIsolation(iso: PatientAlertsData["isolation"]): IsolationInfo | null {
  if (!iso) return null;
  if (typeof iso === "string") return { value: iso, label: iso };
  if (typeof iso === "object" && (iso.value || iso.label)) return iso;
  return null;
}

/** Coerce string-or-object instructions to a plain string for `<Text>`. */
function readInstructions(ins: PatientAlertsData["instructions"]): string {
  if (!ins) return "";
  if (typeof ins === "string") return ins;
  if (typeof ins === "object") return ins.label ?? ins.value ?? ins.description ?? "";
  return "";
}

const ISOLATION_COLORS: Record<string, { fg: string; bg: string }> = {
  success: { fg: "#16A34A", bg: "#DCFCE7" },
  warning: { fg: "#D97706", bg: "#FEF3C7" },
  danger:  { fg: "#DC2626", bg: "#FEE2E2" },
  info:    { fg: "#2563EB", bg: "#DBEAFE" },
  primary: { fg: "#2563EB", bg: "#DBEAFE" },
};
const DEFAULT_ISOLATION_COLOR = { fg: "#2563EB", bg: "#DBEAFE" };

export function PatientAlertsCard({ alerts, expanded, onToggle, colors }: Props) {
  const { t } = useApp();
  const isolation = readIsolation(alerts.isolation);
  const isoColor = isolation?.color
    ? ISOLATION_COLORS[isolation.color] ?? DEFAULT_ISOLATION_COLOR
    : DEFAULT_ISOLATION_COLOR;
  const isoLabel = isolation?.label || isolation?.value || "";
  const instructionsText = readInstructions(alerts.instructions);

  const badges: CollapsibleBadge[] = [
    ...(alerts.allergies.length ? [{ text: String(alerts.allergies.length), bg: "#FEE2E2", fg: "#DC2626" }] : []),
    ...(alerts.contamination.length ? [{ text: String(alerts.contamination.length), bg: "#FEF3C7", fg: "#D97706" }] : []),
    ...(isolation ? [{ text: t("isolation"), bg: isoColor.bg, fg: isoColor.fg }] : []),
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
        <CollapsibleBody open={expanded} style={{ padding: 12, gap: 10 }}>
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

            {instructionsText ? (
              <View style={[s.alertCard, { backgroundColor: "#F59E0B18", borderLeftColor: "#F59E0B" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Feather name="file-text" size={14} color="#F59E0B" />
                  <Text style={[s.alertCardTitle, { color: "#F59E0B" }]}>{t("instructions").toUpperCase()}</Text>
                </View>
                <Text style={[s.alertInstrText, { color: colors.text }]}>{instructionsText}</Text>
              </View>
            ) : null}

            {isolation ? (
              <View style={[s.alertCard, { backgroundColor: `${isoColor.fg}18`, borderLeftColor: isoColor.fg }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Feather name="shield" size={14} color={isoColor.fg} />
                  <Text style={[s.alertCardTitle, { color: isoColor.fg }]}>{t("isolation").toUpperCase()}</Text>
                </View>
                <Text style={[s.alertInstrText, { color: colors.text }]}>{isoLabel}</Text>
                {isolation.description ? (
                  <Text style={[s.alertInstrText, { color: colors.textSecondary, marginTop: 2, fontSize: 12 }]}>
                    {isolation.description}
                  </Text>
                ) : null}
              </View>
            ) : null}
        </CollapsibleBody>
      </Card>
    </Animated.View>
  );
}
