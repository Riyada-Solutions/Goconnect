import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ScreenBackground } from "@/components/common/ScreenBackground";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ListSkeleton, SlotCardSkeleton } from "@/components/skeletons";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useSlots } from "@/hooks/useScheduler";
import { useTheme } from "@/hooks/useTheme";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY_INDEX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const TYPE_COLORS: Record<string, string> = {
  "Follow-up": Colors.primary,
  Consultation: "#6366F1",
  Emergency: "#EF4444",
  Break: "#9CA3AF",
};

// Build N weeks of days centred on the current week
const WEEK_COUNT = 5; // show 5 weeks total (2 before + current + 2 after)
function buildCalendarDays() {
  const now = new Date();
  const dow = now.getDay() === 0 ? 7 : now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - (dow - 1));

  const totalDays = WEEK_COUNT * 7;
  const startMonday = new Date(thisMonday);
  startMonday.setDate(thisMonday.getDate() - 2 * 7); // 2 weeks before

  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startMonday);
    d.setDate(startMonday.getDate() + i);
    return {
      name: DAY_NAMES[i % 7],
      date: d.getDate(),
      month: d.toLocaleString("default", { month: "short" }),
      fullDate: d,
      isToday:
        d.toDateString() === now.toDateString(),
      globalIndex: i,
    };
  });
}

const CALENDAR_DAYS = buildCalendarDays();
const TODAY_GLOBAL = CALENDAR_DAYS.findIndex((d) => d.isToday);
const DAY_CELL_WIDTH = 52;

function to12h(time: string): { time: string; meridiem: "AM" | "PM" } {
  const [hStr, mStr = "00"] = time.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return { time, meridiem: "AM" };
  const meridiem = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${h12}:${mStr.padStart(2, "0")}`, meridiem };
}

export default function SchedulerScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad, horizontal, listGap } = useScreenPadding({ hasTabBar: true });
  const [selectedGlobal, setSelectedGlobal] = useState(
    TODAY_GLOBAL >= 0 ? TODAY_GLOBAL : 2 * 7 + TODAY_INDEX,
  );
  const calendarRef = useRef<ScrollView>(null);

  const {
    data: slots = [],
    isLoading: slotsLoading,
    isError: slotsError,
    refetch: refetchSlots,
  } = useSlots();
  const { refreshing, onRefresh } = usePullToRefresh(refetchSlots);
  const showSkeleton = slotsLoading || refreshing;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenBackground />
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("schedule")}
          </Text>
        </View>

        {/* Scrollable Calendar Strip */}
        <ScrollView
          ref={calendarRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarContent}
          onLayout={() => {
            // Scroll so the selected day is centred
            const offset =
              selectedGlobal * DAY_CELL_WIDTH -
              (DAY_CELL_WIDTH * 3);
            calendarRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
          }}
        >
          {CALENDAR_DAYS.map((day, i) => {
            const isSelected = selectedGlobal === i;
            const isNewMonth =
              i === 0 ||
              day.month !== CALENDAR_DAYS[i - 1].month;

            return (
              <View key={i} style={styles.dayWrapper}>
                {isNewMonth && (
                  <Text style={[styles.monthLabel, { color: colors.textTertiary }]}>
                    {day.month}
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedGlobal(i);
                  }}
                  style={[
                    styles.dayCell,
                    isSelected && {
                      backgroundColor: Colors.primary,
                      borderRadius: 14,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayName,
                      {
                        color: isSelected
                          ? "rgba(255,255,255,0.8)"
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {day.name}
                  </Text>
                  <Text
                    style={[
                      styles.dayDate,
                      {
                        color: isSelected ? "#fff" : colors.text,
                        fontFamily: day.isToday
                          ? "Inter_700Bold"
                          : "Inter_500Medium",
                      },
                    ]}
                  >
                    {day.date}
                  </Text>
                  {day.isToday && !isSelected && (
                    <View
                      style={[
                        styles.todayDot,
                        { backgroundColor: Colors.primary },
                      ]}
                    />
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Slots list */}
      {showSkeleton ? (
        <ListSkeleton
          count={10}
          renderItem={() => <SlotCardSkeleton />}
          style={{ paddingBottom: botPad }}
        />
      ) : slotsError ? (
        <ErrorState onRetry={() => refetchSlots()} />
      ) : (
      <ScrollView
        contentContainerStyle={{
          padding: horizontal,
          paddingBottom: botPad,
          gap: listGap,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
          {CALENDAR_DAYS[selectedGlobal]?.name},{" "}
          {CALENDAR_DAYS[selectedGlobal]?.date}{" "}
          {CALENDAR_DAYS[selectedGlobal]?.month} — {slots.length} appointments
        </Text>

        {slots.map((slot, i) => {
          const typeColor = TYPE_COLORS[slot.type] ?? Colors.primary;
          const hasPatient = !!slot.patientName;
          const start = to12h(slot.time);
          const end = to12h(slot.endTime);

          return (
            <Animated.View
              key={slot.id}
              entering={FadeInDown.delay(i * 50).springify()}
            >
              <Pressable
                onPress={() => {
                  if (hasPatient) {
                    Haptics.selectionAsync();
                    router.push({
                      pathname: "/appointments/[id]",
                      params: { id: slot.id },
                    });
                  }
                }}
              >
                <Card
                  style={[
                    styles.slotCard,
                    !hasPatient && { opacity: 0.5 },
                  ]}
                >
                  <View style={styles.slotRow}>
                    {/* Time Column */}
                    <View style={styles.timeCol}>
                      <Text style={[styles.slotTime, { color: typeColor }]}>
                        {start.time}
                      </Text>
                      <Text style={[styles.slotMeridiem, { color: typeColor }]}>
                        {start.meridiem}
                      </Text>
                      {/* <Text
                        style={[
                          styles.slotEndTime,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {end.time}
                      </Text> */}
                      {/* <Text
                        style={[
                          styles.slotEndMeridiem,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {end.meridiem}
                      </Text> */}
                    </View>

                    {/* Color bar */}
                    <View
                      style={[styles.colorBar, { backgroundColor: typeColor }]}
                    />

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      {hasPatient ? (
                        <>
                          <View style={styles.slotPatientRow}>
                            <Avatar
                              name={slot.patientName}
                              size={32}
                              color={typeColor}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.slotPatient,
                                  { color: colors.text },
                                ]}
                              >
                                {slot.patientName}
                              </Text>
                              <Text
                                style={[
                                  styles.slotProvider,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {slot.provider}
                              </Text>
                            </View>
                          </View>
                          {slot.instructions ? (
                            <View
                              style={[
                                styles.slotInstructionsBlock,
                                { borderTopColor: colors.borderLight },
                              ]}
                            >
                              <View style={styles.slotInstructionsHeader}>
                                <Feather
                                  name="file-text"
                                  size={12}
                                  color={colors.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.slotInstructionsLabel,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  {t("instructions")}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.slotNotes,
                                  { color: colors.text },
                                ]}
                                numberOfLines={3}
                              >
                                {slot.instructions}
                              </Text>
                            </View>
                          ) : null}
                        </>
                      ) : (
                        <Text
                          style={[
                            styles.slotType,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {slot.type}
                        </Text>
                      )}
                    </View>

                    <View style={styles.slotRight}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: `${typeColor}20` },
                        ]}
                      >
                        <Text style={[styles.typeText, { color: typeColor }]}>
                          {slot.type}
                        </Text>
                      </View>
                      {hasPatient && (
                        <StatusBadge status={slot.status} size="sm" />
                      )}
                    </View>
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          );
        })}

        {slots.length === 0 && (
          <EmptyState
            icon="calendar"
            title={t("noAppointments")}
            description={t("noAppointmentsDescription")}
          />
        )}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  calendarContent: {
    paddingHorizontal: 4,
    gap: 0,
  },
  dayWrapper: {
    width: DAY_CELL_WIDTH,
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayCell: {
    width: DAY_CELL_WIDTH,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  dayDate: {
    fontSize: 16,
    marginTop: 2,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  dateLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  slotCard: {
    padding: 16,
    minHeight: 110,
    opacity: 0.7,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timeCol: {
    width: 56,
    alignItems: "center",
  },
  slotTime: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  slotMeridiem: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  slotEndTime: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 8,
  },
  slotEndMeridiem: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  colorBar: {
    width: 3,
    height: "100%",
    minHeight: 50,
    borderRadius: 2,
  },
  slotPatientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  slotPatient: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  slotProvider: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  slotNotes: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  slotInstructionsBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 4,
  },
  slotInstructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  slotInstructionsLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  slotType: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  slotRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
