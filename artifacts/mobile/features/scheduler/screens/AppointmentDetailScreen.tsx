import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/common/ActionButton";
import { Avatar } from "@/components/common/Avatar";
import { Card } from "@/components/common/Card";
import { CareTeamCard } from "@/components/common/CareTeamCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Colors } from "@/theme/colors";
import { useSlot } from "@/hooks/useScheduler";
import { usePatient } from "@/hooks/usePatients";
import { useTheme } from "@/hooks/useTheme";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";


export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 24);

  const { data: record } = useSlot(Number(id));
  const patientId = (record as any)?.patientId as number | undefined;
  const { data: patientRecord } = usePatient(patientId ?? 0);

  const [status, setStatus] = useState<"pending" | "confirmed" | "checked-in">(
    record?.status === "confirmed" ? "confirmed" : "pending",
  );
  const patientBloodType = patientRecord?.bloodType;
  const patientStatus = patientRecord?.status;
  const patientDiagnosis = (record as any)?.diagnosis as string | undefined || patientRecord?.diagnosis;

  if (!record) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={s.headerBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text, flex: 1 }]}>Appointment Details</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Feather name="alert-circle" size={48} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontFamily: "Inter_500Medium" }}>
            {id ? "Appointment not found" : "Loading..."}
          </Text>
        </View>
      </View>
    );
  }

  const medicalTeam = (record as any).medicalTeam as { name: string; role: string; phone?: string }[] | undefined;

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("confirmed");
    showDialog({ variant: "success", title: "Confirmed", message: "Appointment confirmed successfully." });
  };

  const handleCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("checked-in");
    showDialog({ variant: "success", title: "Checked In", message: "Patient checked in successfully." });
  };

  const typeColor =
    record.type === "Emergency" ? "#EF4444" :
    record.type === "Consultation" ? "#6366F1" :
    record.type === "Break" ? "#9CA3AF" : Colors.primary;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <FeedbackDialog {...dialogProps} />
      <View style={[s.headerBar, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text, flex: 1 }]}>Appointment Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: botPad + 80, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Patient Hero ───────────────────────────────────────────── */}
        {record.patientName && (
          <Animated.View entering={FadeInDown.delay(30).springify()}>
            <View style={[s.heroCard, { backgroundColor: isDark ? Colors.dark.card : "#fff" }]}>
              <Pressable
                onPress={() => {
                  if (patientId) { Haptics.selectionAsync(); router.push({ pathname: "/patients/[id]", params: { id: patientId } }); }
                }}
                style={s.heroTop}
              >
                <Avatar name={record.patientName} size={54} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.heroName, { color: colors.text }]}>{record.patientName}</Text>
                  {patientDiagnosis ? (
                    <Text style={[s.heroType, { color: colors.textSecondary }]}>{patientDiagnosis}</Text>
                  ) : null}
                  <View style={s.heroBadges}>
                    {patientStatus === "critical" && (
                      <View style={s.criticalBadge}>
                        <View style={s.criticalDot} />
                        <Text style={s.criticalText}>Critical</Text>
                      </View>
                    )}
                    {patientBloodType && (
                      <View style={s.bloodBadge}>
                        <Feather name="database" size={11} color="#6B7280" />
                        <Text style={[s.bloodText, { color: colors.textSecondary }]}>{patientBloodType}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textTertiary} />
              </Pressable>
              {(record.phone || record.address) && (
                <View style={[s.heroActions, { borderTopColor: colors.borderLight }]}>
                  {record.phone && <ActionButton type="call" value={record.phone} />}
                  {record.address && <ActionButton type="location" value={record.address} />}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* ─── Appointment Summary ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Card style={s.summaryCard}>
            <View style={[s.typeBadge, { backgroundColor: `${typeColor}15` }]}>
              <View style={[s.typeDot, { backgroundColor: typeColor }]} />
              <Text style={[s.typeText, { color: typeColor }]}>{record.type}</Text>
            </View>
            <Text style={[s.patientNameLarge, { color: colors.text }]}>{record.patientName}</Text>
            {record.notes && (
              <Text style={[s.notesText, { color: colors.textSecondary }]}>{record.notes}</Text>
            )}
            <View style={s.divider} />
            <View style={s.infoGrid}>
              <View style={s.infoItem}>
                <Feather name="clock" size={14} color={Colors.primary} />
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>Time</Text>
                <Text style={[s.infoValue, { color: colors.text }]}>{record.time} - {record.endTime}</Text>
              </View>
              <View style={s.infoItem}>
                <Feather name="calendar" size={14} color={Colors.primary} />
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>Date</Text>
                <Text style={[s.infoValue, { color: colors.text }]}>{record.visitDate || "Today"}</Text>
              </View>
              <View style={s.infoItem}>
                <Feather name="home" size={14} color={Colors.primary} />
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>Hospital</Text>
                <Text style={[s.infoValue, { color: colors.text }]} numberOfLines={2}>{record.hospital || "—"}</Text>
              </View>
              <View style={s.infoItem}>
                <Feather name="shield" size={14} color={Colors.primary} />
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>Insurance</Text>
                <Text style={[s.infoValue, { color: colors.text }]}>{record.insurance || "N/A"}</Text>
              </View>
            </View>

            {/* Status */}
            <View style={[s.statusRow, { borderTopColor: colors.borderLight }]}>
              <Text style={[s.statusLabel, { color: colors.textSecondary }]}>Status</Text>
              <StatusBadge
                status={status === "checked-in" ? "Checked In" : status === "confirmed" ? "Confirmed" : "Pending"}
              />
            </View>
          </Card>
        </Animated.View>


        {/* ─── Care Team ─────────────────────────────────────────────── */}
        <CareTeamCard
          provider={(record as any).provider}
          medicalTeam={medicalTeam}
          colors={colors}
          animDelay={150}
        />

        {/* ─── Additional Info ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Appointment Info</Text>
          <Card>
            <View style={s.detailRow}>
              <Feather name="user" size={16} color={Colors.primary} />
              <Text style={[s.detailLabel, { color: colors.textSecondary }]}>Provider</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{(record as any).provider || "—"}</Text>
            </View>
            <View style={[s.thinDivider, { backgroundColor: colors.borderLight }]} />
            <View style={s.detailRow}>
              <Feather name="watch" size={16} color={Colors.primary} />
              <Text style={[s.detailLabel, { color: colors.textSecondary }]}>Visit Time</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{record.visitTime || "—"}</Text>
            </View>
            <View style={[s.thinDivider, { backgroundColor: colors.borderLight }]} />
            <View style={s.detailRow}>
              <Feather name="clock" size={16} color={Colors.primary} />
              <Text style={[s.detailLabel, { color: colors.textSecondary }]}>Doctor Time</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{record.doctorTime || "—"}</Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* ─── Bottom Action Button ─────────────────────────────────────── */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.card, borderTopColor: colors.borderLight }]}>
        {status === "pending" && (
          <Pressable onPress={handleConfirm} style={[s.actionBtn, { backgroundColor: Colors.primary }]}>
            <Feather name="check" size={20} color="#fff" />
            <Text style={s.actionBtnText}>Confirm Appointment</Text>
          </Pressable>
        )}
        {status === "confirmed" && (
          <Pressable onPress={handleCheckIn} style={[s.actionBtn, { backgroundColor: "#22C55E" }]}>
            <Feather name="log-in" size={20} color="#fff" />
            <Text style={s.actionBtnText}>Check In Patient</Text>
          </Pressable>
        )}
        {status === "checked-in" && (
          <View style={[s.actionBtn, { backgroundColor: "#E0E7FF" }]}>
            <Feather name="check-circle" size={20} color="#6366F1" />
            <Text style={[s.actionBtnText, { color: "#6366F1" }]}>Patient Checked In</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },

  summaryCard: { padding: 16, gap: 12 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  patientNameLarge: { fontSize: 22, fontFamily: "Inter_700Bold" },
  notesText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoItem: { width: "46%", gap: 2, paddingVertical: 4 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1 },
  statusLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },

  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 8 },

  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  contactName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  contactSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  contactAction: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  contactIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  contactActionLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  contactActionValue: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 1 },
  thinDivider: { height: 1, marginVertical: 4 },

  teamRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  teamName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  teamRole: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  detailRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_500Medium", width: 90 },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    ...Platform.select({ web: { boxShadow: "0 -2px 10px rgba(0,0,0,0.06)" }, default: {} }),
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

  heroCard: { padding: 20 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroName: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  heroType: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 6, color: "#6B7280" },
  heroBadges: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  criticalBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EF444418", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  criticalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  criticalText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#EF4444" },
  bloodBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F3F4F6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  bloodText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  heroActions: { flexDirection: "row", gap: 10, paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
});
