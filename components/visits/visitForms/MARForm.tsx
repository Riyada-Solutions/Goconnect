import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { Card } from "@/components/common/Card";
import { useApp } from "@/context/AppContext";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import {
  isMarChartedStatus,
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

/**
 * Grid geometry. The frozen medication column and the horizontally scrolling
 * day columns are two separate stacks, so they must agree on row heights to
 * the pixel — otherwise the halves drift apart as you scroll sideways.
 */
const MED_COL_W = 150;
const DAY_COL_W = 104;
const HEAD_H = 38;
const ROW_H = 58;

/** `2026-09-02` → `2026/09/02`, matching the web column headers. */
const gridDate = (iso: string) => iso.replace(/-/g, "/");

interface Props {
  patientId: number;
  colors: any;
  initialExpanded?: boolean;
}

type Selection = { med: MarMedication; date: string; cell: MarDayCell };

/**
 * Medication Administration Record — **read-only** compliance report.
 *
 * Laid out as a matrix to mirror the web MAR: one row per medication, one
 * column per day, a solid status chip only where something was charted. The
 * dose itself is recorded from the Flow Sheet during the visit, so nothing
 * here writes; offline simply serves the last cached range.
 *
 * A cell carries more than fits in a chip (dose, route, time, who, why), so
 * tapping one opens the detail panel below the grid.
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
  const [selected, setSelected] = useState<Selection | null>(null);

  const query = useMedicationAdministration(patientId, range.start, range.end, open);
  const record = query.data;

  // `missed` is dropped everywhere — it reports a charting lapse, not care.
  const legend = (record?.legend ?? []).filter((item) => isMarChartedStatus(item.status));
  const days = record?.days ?? [];
  const meds = record?.medications ?? [];

  // §7 — the server truncates anything longer than its max; say so rather
  // than pretending the requested window was honoured.
  const maxDays = record?.limits.maxDays ?? MAR_MAX_DAYS;
  const wasTruncated = !!record && record.range.days >= maxDays;

  const hasAnyEntry = useMemo(
    () => meds.some((med) => Object.values(med.days).some((cell) => isMarChartedStatus(cell.status))),
    [meds],
  );

  const search = () => {
    Haptics.selectionAsync();
    setSelected(null);
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
            <Text style={{ color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
              {t("marSearch")}
            </Text>
          </Pressable>
        </View>

        {record?.range.startDate ? (
          <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
            Showing {gridDate(record.range.startDate)} → {gridDate(record.range.endDate)} (
            {record.range.days} days){wasTruncated ? ` · capped at ${maxDays} days` : ""}
          </Text>
        ) : null}

        {/* ─── Legend (straight from the API) ────────────────────────── */}
        {legend.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {legend.map((item) => (
              <LegendPill key={item.status} label={item.label} status={item.status} tone={item.tone} />
            ))}
          </View>
        ) : null}

        {query.isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : !record || meds.length === 0 ? (
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

            <MarGrid
              meds={meds}
              days={days}
              colors={colors}
              inactiveLabel={t("inactive")}
              selected={selected}
              onSelect={(med, date, cell) => {
                Haptics.selectionAsync();
                // Tapping the open cell closes it, so the panel can be dismissed.
                setSelected((prev) =>
                  prev && prev.med.id === med.id && prev.date === date ? null : { med, date, cell },
                );
              }}
            />

            {selected ? (
              <CellDetail
                med={selected.med}
                date={selected.date}
                cell={selected.cell}
                colors={colors}
                onClose={() => setSelected(null)}
              />
            ) : hasAnyEntry ? (
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>
                Tap a chip for dose, time and comments.
              </Text>
            ) : null}
          </>
        )}
      </CollapsibleBody>
    </Card>
  );
}

/* ─── Grid ─────────────────────────────────────────────────────────────── */

/**
 * Frozen medication column + horizontally scrolling day columns, as the web
 * renders it. `days` from the response root is the authoritative column
 * order — never re-sort it here.
 */
function MarGrid({
  meds,
  days,
  colors,
  inactiveLabel,
  selected,
  onSelect,
}: {
  meds: MarMedication[];
  days: string[];
  colors: any;
  inactiveLabel: string;
  selected: Selection | null;
  onSelect: (med: MarMedication, date: string, cell: MarDayCell) => void;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: "hidden",
        flexDirection: "row",
      }}
    >
      {/* Frozen medication column */}
      <View style={{ width: MED_COL_W, borderRightWidth: 1, borderRightColor: colors.border }}>
        <View
          style={{
            height: HEAD_H,
            justifyContent: "center",
            paddingHorizontal: 10,
            backgroundColor: colors.borderLight,
          }}
        >
          <Text style={{ fontSize: 11.5, fontFamily: "Inter_700Bold", color: colors.text }}>
            Medication
          </Text>
        </View>
        {meds.map((med) => (
          <View
            key={med.id}
            style={{
              height: ROW_H,
              justifyContent: "center",
              gap: 3,
              paddingHorizontal: 10,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
            }}
          >
            <Text
              numberOfLines={2}
              style={{
                fontSize: 10.5,
                lineHeight: 13,
                fontFamily: "Inter_600SemiBold",
                color: med.isActive ? colors.text : colors.textSecondary,
              }}
            >
              {med.drugName}
            </Text>
            {!med.isActive ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: `${MAR_TONE_COLORS.warning}22`,
                  borderRadius: 4,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 8.5,
                    fontFamily: "Inter_600SemiBold",
                    color: MAR_TONE_COLORS.warning,
                  }}
                >
                  {inactiveLabel}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {/* Horizontally scrolling day columns */}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={{ flexDirection: "row", height: HEAD_H, backgroundColor: colors.borderLight }}>
            {days.map((date) => (
              <View
                key={date}
                style={{ width: DAY_COL_W, justifyContent: "center", alignItems: "center" }}
              >
                <Text
                  style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.textSecondary }}
                >
                  {gridDate(date)}
                </Text>
              </View>
            ))}
          </View>

          {meds.map((med) => (
            <View
              key={med.id}
              style={{
                flexDirection: "row",
                height: ROW_H,
                borderTopWidth: 1,
                borderTopColor: colors.borderLight,
              }}
            >
              {days.map((date) => {
                const cell = med.days[date];
                const isSel = !!selected && selected.med.id === med.id && selected.date === date;
                return (
                  <View
                    key={date}
                    style={{
                      width: DAY_COL_W,
                      alignItems: "center",
                      justifyContent: "center",
                      borderLeftWidth: 1,
                      borderLeftColor: colors.borderLight,
                    }}
                  >
                    {/* A `none` or `missed` day is simply blank. */}
                    {cell && isMarChartedStatus(cell.status) ? (
                      <StatusChip cell={cell} selected={isSel} onPress={() => onSelect(med, date, cell)} />
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** Solid fill matching the web chip. */
function StatusChip({
  cell,
  selected,
  onPress,
}: {
  cell: MarDayCell;
  selected: boolean;
  onPress: () => void;
}) {
  const color = MAR_TONE_COLORS[cell.tone] ?? MAR_TONE_COLORS.muted;
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: color,
        borderRadius: 5,
        paddingHorizontal: 6,
        paddingVertical: 7,
        width: DAY_COL_W - 20,
        alignItems: "center",
        opacity: selected ? 0.75 : 1,
      }}
    >
      <Text
        numberOfLines={2}
        style={{
          fontSize: 9.5,
          lineHeight: 11.5,
          textAlign: "center",
          fontFamily: "Inter_600SemiBold",
          color: "#fff",
        }}
      >
        {cell.label}
      </Text>
    </Pressable>
  );
}

function LegendPill({ label, status, tone }: { label: string; status: string; tone: string }) {
  const color = MAR_TONE_COLORS[(tone as keyof typeof MAR_TONE_COLORS) ?? "muted"] ?? MAR_TONE_COLORS.muted;
  const icon = MAR_STATUS_ICON[status as keyof typeof MAR_STATUS_ICON] ?? "minus";
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
      }}
    >
      <Feather name={icon as any} size={11} color={color} />
      <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color }}>{label}</Text>
    </View>
  );
}

/**
 * §5 spells out exactly what shows where: dose + route on any recorded
 * status, the time only when administered, the reason only when it wasn't.
 */
function CellDetail({
  med,
  date,
  cell,
  colors,
  onClose,
}: {
  med: MarMedication;
  date: string;
  cell: MarDayCell;
  colors: any;
  onClose: () => void;
}) {
  const color = MAR_TONE_COLORS[cell.tone] ?? MAR_TONE_COLORS.muted;
  const subtitle = [med.scientificName, med.form, med.frequency].filter(Boolean).join(" · ");

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: color,
        borderRadius: 10,
        padding: 12,
        gap: 5,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.text }}>
            {med.drugName}
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.textSecondary }}>
            {gridDate(date)} · {cell.label}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10}>
          <Feather name="x" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      {subtitle ? <Detail colors={colors} text={subtitle} /> : null}
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
  );
}

function Detail({ text, colors, color }: { text: string; colors: any; color?: string }) {
  return (
    <Text style={{ fontSize: 11.5, fontFamily: "Inter_400Regular", color: color ?? colors.textSecondary }}>
      {text}
    </Text>
  );
}
