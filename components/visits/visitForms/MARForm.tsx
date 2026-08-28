import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Card } from "@/components/common/Card";
import { useApp } from "@/context/AppContext";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import {
  MAR_STATUS_ICON,
  MAR_TONE_COLORS,
  type MarDayCell,
  type MarMedication,
} from "@/data/models/medicationAdministration";
import {
  MAR_DEFAULT_DAYS,
  MAR_MAX_DAYS,
  marDateOffset,
  useMedicationAdministration,
} from "@/hooks/useMedicationAdministration";
import { DateTimeConverter } from "@/utils/datetime";

import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

interface Props {
  patientId: number;
  colors: any;
  initialExpanded?: boolean;
}

/**
 * Medication Administration Record — **read-only** compliance report.
 *
 * One card per active dialysis medication, one row per day in the range.
 * The dose itself is charted in the Flow Sheet during the visit, so nothing
 * here writes; offline simply serves the last cached range, with no conflict
 * to resolve.
 */
export function MARForm({ patientId, colors, initialExpanded }: Props) {
  const { t } = useApp();
  const [open, setOpen] = useState(initialExpanded ?? false);
  // Draft range the pickers edit; only Search promotes it to the query.
  const [draftStart, setDraftStart] = useState(() => marDateOffset(MAR_DEFAULT_DAYS - 1));
  const [draftEnd, setDraftEnd] = useState(() => marDateOffset(0));
  const [range, setRange] = useState(() => ({
    start: marDateOffset(MAR_DEFAULT_DAYS - 1),
    end: marDateOffset(0),
  }));

  const query = useMedicationAdministration(patientId, range.start, range.end, open);
  const record = query.data;

  const legend = record?.legend ?? [];
  const days = record?.days ?? [];

  // §7 — the server truncates anything longer than its max; say so rather
  // than pretending the requested window was honoured.
  const maxDays = record?.limits.maxDays ?? MAR_MAX_DAYS;
  const wasTruncated = !!record && record.range.days >= maxDays;

  const hasAnyEntry = useMemo(
    () =>
      (record?.medications ?? []).some((med) =>
        Object.values(med.days).some((cell) => cell.status !== "none"),
      ),
    [record],
  );

  const search = () => {
    Haptics.selectionAsync();
    setRange({ start: draftStart, end: draftEnd });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("marTitle")}
        icon="clipboard"
        iconColor="#DB2777"
        badges={[{ text: t("readOnly"), bg: colors.borderLight, fg: colors.textSecondary }]}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody open={open} style={{ padding: 14, gap: 12 }}>
        {/* ─── Date range filter ─────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("marFrom")}</Text>
            <DateTimeField mode="date" value={draftStart} onChange={setDraftStart} colors={colors} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>{t("marTo")}</Text>
            <DateTimeField mode="date" value={draftEnd} onChange={setDraftEnd} colors={colors} />
          </View>
          <Pressable
            onPress={search}
            style={{
              backgroundColor: Colors.primary,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Feather name="search" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>{t("marSearch")}</Text>
          </Pressable>
        </View>

        {record?.range.startDate ? (
          <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
            Showing {record.range.startDate} → {record.range.endDate} ({record.range.days} days)
            {wasTruncated ? ` · capped at ${maxDays} days` : ""}
          </Text>
        ) : null}

        {/* ─── Legend (straight from the API) ────────────────────────── */}
        {legend.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {legend.map((item) => (
              <StatusPill key={item.status} label={item.label} status={item.status} tone={item.tone} />
            ))}
          </View>
        ) : null}

        {query.isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : !record || record.medications.length === 0 ? (
          <View style={{ paddingVertical: 18, alignItems: "center", gap: 6 }}>
            <Feather name="clipboard" size={22} color={colors.textTertiary} />
            <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.textSecondary }}>
              {t("marEmpty")}
            </Text>
          </View>
        ) : (
          <>
            {!hasAnyEntry ? (
              <View
                style={{
                  backgroundColor: `${Colors.primary}12`,
                  borderRadius: 10,
                  padding: 10,
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <Feather name="info" size={14} color={Colors.primary} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: colors.text }}>
                  {t("marNoSessions")}
                </Text>
              </View>
            ) : null}

            {record.medications.map((med) => (
              <MedicationCard key={med.id} med={med} days={days} colors={colors} />
            ))}
          </>
        )}
      </CollapsibleBody>
    </Card>
  );
}

function StatusPill({ label, status, tone }: { label: string; status: string; tone: string }) {
  const color = MAR_TONE_COLORS[(tone as keyof typeof MAR_TONE_COLORS) ?? "muted"] ?? MAR_TONE_COLORS.muted;
  const icon = MAR_STATUS_ICON[status as keyof typeof MAR_STATUS_ICON] ?? "minus";
  // `missed` shares the warning tone with `not_administered` but gets a
  // dashed outline — a charting lapse must not read as a clinical decision.
  const dashed = status === "missed";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: `${color}1F`,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderWidth: dashed ? 1 : 0,
        borderStyle: dashed ? "dashed" : "solid",
        borderColor: color,
      }}
    >
      <Feather name={icon as any} size={11} color={color} />
      <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color }}>{label}</Text>
    </View>
  );
}

function MedicationCard({ med, days, colors }: { med: MarMedication; days: string[]; colors: any }) {
  const subtitle = [med.scientificName, med.form, med.dosage, med.route, med.frequency]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: "hidden" }}>
      <View style={{ padding: 12, gap: 5, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <Text style={{ fontSize: 13.5, fontFamily: "Inter_700Bold", color: colors.text }}>
          {med.drugName}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
            {subtitle}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
          <SummaryChip icon="check-circle" color="#10B981" count={med.summary.administered} />
          <SummaryChip icon="alert-triangle" color="#F59E0B" count={med.summary.notAdministered} />
          <SummaryChip icon="circle" color="#F59E0B" count={med.summary.missed} />
          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.textTertiary }}>
            {med.summary.scheduled} scheduled
          </Text>
        </View>
      </View>

      {/* `days` from the response root is the authoritative column order. */}
      {days.map((date) => {
        const cell = med.days[date];
        if (!cell) return null;
        return <DayRow key={date} date={date} cell={cell} colors={colors} />;
      })}
    </View>
  );
}

function SummaryChip({ icon, color, count }: { icon: string; color: string; count: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Feather name={icon as any} size={12} color={color} />
      <Text style={{ fontSize: 11.5, fontFamily: "Inter_700Bold", color }}>{count}</Text>
    </View>
  );
}

/**
 * One day cell. §5 spells out exactly what shows where: dose + route on any
 * recorded status, the time only when administered, the reason only when it
 * wasn't — and a plain dash when the drug wasn't scheduled at all.
 */
function DayRow({ date, cell, colors }: { date: string; cell: MarDayCell; colors: any }) {
  const color = MAR_TONE_COLORS[cell.tone] ?? MAR_TONE_COLORS.muted;
  const isNone = cell.status === "none";

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: isNone ? 6 : 9,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        opacity: isNone ? 0.55 : 1,
      }}
    >
      <Text
        style={{
          width: 84,
          fontSize: 11.5,
          fontFamily: "Inter_500Medium",
          color: colors.textSecondary,
        }}
      >
        {date}
      </Text>
      <View style={{ flex: 1, gap: 4 }}>
        <StatusPill label={cell.label} status={cell.status} tone={cell.tone} />
        {!isNone ? (
          <View style={{ gap: 2 }}>
            {cell.dosage || cell.route ? (
              <Detail
                colors={colors}
                text={[cell.dosage ? `Dose: ${cell.dosage}` : null, cell.route ? `Route: ${cell.route}` : null]
                  .filter(Boolean)
                  .join("  ·  ")}
              />
            ) : null}
            {cell.status === "administered" && cell.givenAt ? (
              <Detail colors={colors} text={`Given: ${DateTimeConverter.time(cell.givenAt)}`} />
            ) : null}
            {cell.administeredBy ? <Detail colors={colors} text={`By: ${cell.administeredBy}`} /> : null}
            {cell.status === "not_administered" && cell.reason ? (
              <Detail colors={colors} text={`Comment: ${cell.reason}`} color={color} />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Detail({ text, colors, color }: { text: string; colors: any; color?: string }) {
  return (
    <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: color ?? colors.textSecondary }}>
      {text}
    </Text>
  );
}
