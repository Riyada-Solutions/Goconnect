import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";

import { BottomSheet } from "@/components/common/BottomSheet";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import { drugLabel, type PatientMedication } from "@/data/models/patientMedication";
import { useMedicationRefills } from "@/hooks/usePatientMedications";
import { DateTimeConverter } from "@/utils/datetime";

import { MedicationStatusBadge } from "./MedicationCard";

interface Props {
  visible: boolean;
  onClose: () => void;
  patientId: number;
  medication: PatientMedication | null;
  isLoading?: boolean;
  canEdit: boolean;
  canRefill: boolean;
  busy: boolean;
  onEdit: () => void;
  onRefill: () => void;
  onStop: () => void;
  onDose: () => void;
  colors: any;
}

/**
 * Detail sheet — every field of one medication, plus its refill history.
 *
 * History is only fetched when the nurse opens that row: it is a separate
 * endpoint and most of the time nobody looks at it.
 */
export function MedicationDetailSheet({
  visible,
  onClose,
  patientId,
  medication,
  isLoading,
  canEdit,
  canRefill,
  busy,
  onEdit,
  onRefill,
  onStop,
  onDose,
  colors,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [historyOpen, setHistoryOpen] = useState(false);
  const refillsQuery = useMedicationRefills(patientId, medication?.id ?? null, visible && historyOpen);
  const refills = refillsQuery.data ?? [];

  const row = (label: string, value: string) => (
    <View
      key={label}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <Text style={{ flex: 1, fontSize: 12.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
        {label}
      </Text>
      <Text
        style={{ flex: 1.4, fontSize: 12.5, fontFamily: "Inter_600SemiBold", color: colors.text, textAlign: "right" }}
      >
        {value || "—"}
      </Text>
    </View>
  );

  const dateRange = (med: PatientMedication) =>
    med.startDate
      ? `${DateTimeConverter.date(med.startDate)} → ${med.endDate ? DateTimeConverter.date(med.endDate) : "no end date"}`
      : "—";

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={medication ? drugLabel(medication.drug) || `#${medication.id}` : "Medication"}
      subtitle={medication?.drug?.code ?? undefined}
      maxHeightRatio={0.92}
    >
      {isLoading || !medication ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            style={{ maxHeight: windowHeight * 0.62 }}
            contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <MedicationStatusBadge medication={medication} colors={colors} />
              {medication.isAcknowledged ? (
                <View style={[s.badge, { backgroundColor: "#10B98122" }]}>
                  <Text style={[s.badgeText, { color: "#047857" }]}>Acknowledged</Text>
                </View>
              ) : null}
            </View>

            {row("Form", medication.form)}
            {row("Dosage", medication.dosage)}
            {row("Frequency", medication.frequency)}
            {row("Route", medication.route)}
            {row("Duration", medication.duration)}
            {medication.durationPeriod ? row("Duration period", medication.durationPeriod) : null}
            {medication.administrationType ? row("Administration type", medication.administrationType) : null}
            {row("Start / End", dateRange(medication))}
            {medication.quantity ? row("Quantity", medication.quantity) : null}
            {row("Administered by", medication.administeredBy)}
            {row(
              "Last dose",
              medication.lastDoseAt ? DateTimeConverter.dateTime(medication.lastDoseAt) : "None",
            )}
            {row("Acknowledged", medication.isAcknowledged ? "Yes" : "No")}
            {medication.instructions ? row("Instructions", medication.instructions) : null}
            {medication.createdBy ? row("Prescribed by", medication.createdBy.name) : null}

            {/* Refills — tapping the row loads the history behind it. */}
            <Pressable
              onPress={() => setHistoryOpen((prev) => !prev)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 9,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
            >
              <Text style={{ flex: 1, fontSize: 12.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
                Refills
              </Text>
              <Text style={{ fontSize: 12.5, fontFamily: "Inter_600SemiBold", color: colors.text }}>
                {medication.refills != null
                  ? `${medication.remainingRefills ?? Math.max(0, medication.refills - medication.refillsUsed)} of ${medication.refills} left`
                  : `${medication.refillsUsed} used`}
              </Text>
              <Feather name={historyOpen ? "chevron-up" : "chevron-right"} size={15} color={colors.textSecondary} />
            </Pressable>

            {historyOpen ? (
              <View style={{ gap: 8, paddingTop: 8 }}>
                {refillsQuery.isLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : refills.length === 0 ? (
                  <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
                    No refills recorded yet.
                  </Text>
                ) : (
                  refills.map((entry) => (
                    <View
                      key={entry.id}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        padding: 10,
                        gap: 2,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ flex: 1, fontSize: 12.5, fontFamily: "Inter_600SemiBold", color: colors.text }}>
                          {entry.refilledAt ? DateTimeConverter.dateTime(entry.refilledAt) : "—"}
                        </Text>
                        <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
                          {entry.by || "—"}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
                        {entry.notes || "No notes"}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
            }}
          >
            {canRefill ? (
              <SheetButton
                icon="refresh-cw"
                label="Refill"
                background={Colors.primary}
                foreground="#fff"
                disabled={busy || !medication.canRefill}
                onPress={onRefill}
              />
            ) : null}
            {canEdit ? (
              <>
                <SheetButton
                  icon="edit-2"
                  label="Edit"
                  background={colors.borderLight}
                  foreground={colors.text}
                  disabled={busy}
                  onPress={onEdit}
                />
                <SheetButton
                  icon="check-square"
                  label="Dose"
                  background={colors.borderLight}
                  foreground={colors.text}
                  disabled={busy}
                  onPress={onDose}
                />
                {medication.status ? (
                  <SheetButton
                    icon="slash"
                    label="Stop"
                    background="#EF444416"
                    foreground="#DC2626"
                    disabled={busy}
                    onPress={onStop}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        </>
      )}
    </BottomSheet>
  );
}

function SheetButton({
  icon,
  label,
  background,
  foreground,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  background: string;
  foreground: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexGrow: 1,
        flexBasis: 90,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: background,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Feather name={icon as any} size={14} color={foreground} />
      <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: foreground }}>{label}</Text>
    </Pressable>
  );
}
