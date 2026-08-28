import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import { drugLabel, type PatientMedication } from "@/data/models/patientMedication";
import { DateTimeConverter } from "@/utils/datetime";

/** Expired (red) · Stopped (grey) · Ongoing (green) · Active (neutral) — §1.1. */
export function MedicationStatusBadge({
  medication,
  colors,
}: {
  medication: PatientMedication;
  colors: any;
}) {
  const tone = !medication.status
    ? { text: "Stopped", bg: colors.borderLight, fg: colors.textSecondary }
    : medication.isExpired
      ? { text: "Expired", bg: "#EF444422", fg: "#DC2626" }
      : !medication.endDate
        ? { text: "Ongoing", bg: "#10B98122", fg: "#047857" }
        : { text: "Active", bg: `${Colors.primary}1A`, fg: Colors.primary };

  return (
    <View style={[s.badge, { backgroundColor: tone.bg }]}>
      <Text style={[s.badgeText, { color: tone.fg }]}>{tone.text}</Text>
    </View>
  );
}

interface Props {
  medication: PatientMedication;
  colors: any;
  busy: boolean;
  canEdit: boolean;
  canRefill: boolean;
  onOpen: () => void;
  onRefill: () => void;
  onEdit: () => void;
  onDose: () => void;
  onStop: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}

/**
 * One medication as a card (§1.1: cards, not a table).
 *
 * Order is fixed by the mockup: name → status → tags → dates → refills →
 * last dose → actions. Active rows offer Refill / Edit / Dose / Stop;
 * deactivated ones only Reactivate / Delete.
 */
export function MedicationCard({
  medication,
  colors,
  busy,
  canEdit,
  canRefill,
  onOpen,
  onRefill,
  onEdit,
  onDose,
  onStop,
  onReactivate,
  onDelete,
}: Props) {
  const tags = [medication.form, medication.dosage, medication.frequency, medication.route].filter(Boolean);

  const dates = medication.startDate
    ? `${DateTimeConverter.date(medication.startDate)} → ${
        medication.endDate ? DateTimeConverter.date(medication.endDate) : "no end date"
      }`
    : "—";

  const refillText =
    medication.refills != null
      ? `Refills ${medication.remainingRefills ?? Math.max(0, medication.refills - medication.refillsUsed)}/${medication.refills}`
      : medication.refillsUsed > 0
        ? `Refilled ${medication.refillsUsed}×`
        : "—";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        gap: 8,
        opacity: medication.status ? 1 : 0.75,
      }}
    >
      <Pressable onPress={onOpen} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.text }}>
            {medication.drug?.name || drugLabel(medication.drug) || `#${medication.id}`}
          </Text>
          <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
            {[medication.drug?.scientificName, medication.drug?.code].filter(Boolean).join(" · ") || "—"}
          </Text>
        </View>
        <MedicationStatusBadge medication={medication} colors={colors} />
        <Feather name="chevron-right" size={16} color={colors.textTertiary} />
      </Pressable>

      {tags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {tags.map((tag, i) => (
            <View
              key={`${tag}-${i}`}
              style={{
                backgroundColor: colors.borderLight,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.textSecondary }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <CardRow left={dates} right={refillText} colors={colors} />
      <CardRow
        left="Last dose"
        right={medication.lastDoseAt ? DateTimeConverter.dateTime(medication.lastDoseAt) : "None"}
        colors={colors}
      />

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {medication.status ? (
          <>
            {canRefill ? (
              <CardButton
                icon="refresh-cw"
                label="Refill"
                color={Colors.primary}
                // §12.4 — `can_refill` is the only correct gate for this.
                disabled={busy || !medication.canRefill}
                onPress={onRefill}
                colors={colors}
              />
            ) : null}
            {canEdit ? (
              <>
                <CardButton icon="edit-2" label="Edit" color={Colors.primary} disabled={busy} onPress={onEdit} colors={colors} />
                <CardButton icon="check-square" label="Dose" color="#059669" disabled={busy} onPress={onDose} colors={colors} />
                <CardButton icon="slash" label="Stop" color="#EF4444" disabled={busy} onPress={onStop} colors={colors} />
              </>
            ) : null}
          </>
        ) : canEdit ? (
          <>
            <CardButton icon="rotate-ccw" label="Reactivate" color={Colors.primary} disabled={busy} onPress={onReactivate} colors={colors} />
            <CardButton icon="trash-2" label="Delete" color="#EF4444" disabled={busy} onPress={onDelete} colors={colors} />
          </>
        ) : null}
      </View>
    </View>
  );
}

function CardRow({ left, right, colors }: { left: string; right: string; colors: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text style={{ flex: 1, fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
        {left}
      </Text>
      <Text style={{ fontSize: 11.5, fontFamily: "Inter_500Medium", color: colors.textSecondary }}>
        {right}
      </Text>
    </View>
  );
}

function CardButton({
  icon,
  label,
  color,
  onPress,
  disabled,
  colors,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Feather name={icon as any} size={13} color={color} />
      <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color }}>{label}</Text>
    </Pressable>
  );
}
