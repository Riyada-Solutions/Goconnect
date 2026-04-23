import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/common/ActionButton";
import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import type { Patient } from "@/data/models/patient";

interface PatientCardProps {
  patient: Patient;
  onPress?: () => void;
  /** When true, tapping navigates to /patients/[id]. Ignored if onPress is provided. Default: true */
  navigateOnPress?: boolean;
  /** Show phone / location action buttons in the footer. Default: true */
  showActions?: boolean;
}

export function PatientCard({
  patient,
  onPress,
  navigateOnPress = true,
  showActions = true,
}: PatientCardProps) {
  const { t } = useApp();
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.selectionAsync();
    if (onPress) {
      onPress();
      return;
    }
    if (navigateOnPress) {
      router.push({
        pathname: "/patients/[id]",
        params: { id: patient.id },
      });
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Avatar name={patient.name} imageUrl={patient.avatarUrl} size={50} />
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {patient.name}
            </Text>
            <View style={styles.idRow}>
              <Feather name="hash" size={11} color={colors.textTertiary} />
              <Text
                style={[styles.idText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {patient.patientId}
              </Text>
            </View>
          </View>
          <StatusBadge status={patient.status} size="sm" />
        </View>

        <View style={[styles.metaGrid, { borderTopColor: colors.borderLight }]}>
          <View style={styles.metaItem}>
            <Feather name="file-text" size={11} color={colors.textTertiary} />
            <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
              {t("mrn")}
            </Text>
            <Text
              style={[styles.metaValue, { color: colors.text }]}
              numberOfLines={1}
            >
              {patient.mrn}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={11} color={colors.textTertiary} />
            <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
              {t("dob")}
            </Text>
            <Text
              style={[styles.metaValue, { color: colors.text }]}
              numberOfLines={1}
            >
              {patient.dob}
            </Text>
          </View>
        </View>

        <View style={[styles.footerRow, { borderTopColor: colors.borderLight }]}>
          <View style={styles.lastVisitRow}>
            <Feather name="clock" size={12} color={colors.textTertiary} />
            <Text
              style={[styles.lastVisit, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {t("lastVisit")}: {patient.lastVisit}
            </Text>
          </View>
          {showActions && (
            <View style={styles.actions}>
              {patient.phone ? (
                <ActionButton type="call" value={patient.phone} />
              ) : null}
              {patient.address ? (
                <ActionButton type="location" value={patient.address} />
              ) : null}
              <ActionButton type="labResults" value={patient.id} />
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  idText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexBasis: "48%",
    flexGrow: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  metaValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  lastVisitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  lastVisit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
