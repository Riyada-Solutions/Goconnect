import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { CareTeamView } from "@/components/common/CareTeamView";
import { CustomButton } from "@/components/common/CustomButton";
import { RuleGate } from "@/components/common/RuleGate";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PatientCard } from "@/components/common/PatientCard";
import { ScreenBackground } from "@/components/common/ScreenBackground";
import { SectionHeader } from "@/components/common/SectionHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppointmentDetailSkeleton } from "@/components/skeletons";
import { CARD_BG_ALPHA, Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import {
  useCancelAppointment,
  useCheckInAppointment,
  useConfirmAppointment,
  useConfirmAppointmentForNurse,
  useSlot,
} from "@/hooks/useScheduler";
import { AppointmentStatus, appointmentStatusLabel, normalizeAppointmentStatus } from "@/data/models/scheduler";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useTheme } from "@/hooks/useTheme";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";


export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, can } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad, horizontal, gap, insets } = useScreenPadding({
    hasActionBar: true,
  });
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const { data: record, isLoading, isFetching, isError, refetch } = useSlot(Number(id));
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  // Patient hero card data rides on the slot response (single source of truth).
  const patientRecord = (record as any)?.patient ?? null;

  // Derive status straight from the server record so it stays in sync after
  // refetches/mutations.
  const status: AppointmentStatus =
    normalizeAppointmentStatus(record?.status) ?? AppointmentStatus.Pending;

  const confirmMutation = useConfirmAppointment();
  const checkInMutation = useCheckInAppointment();
  const cancelMutation = useCancelAppointment();
  const confirmForNurseMutation = useConfirmAppointmentForNurse();
  const canConfirmForOthers = can('confirm_for_others');

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    confirmMutation.mutate(Number(id), {
      onSuccess: () =>
        showDialog({ variant: "success", title: t("confirmed"), message: t("appointmentConfirmedMessage") }),
      onError: (err) =>
        showDialog({ variant: "error", title: t("error"), message: err.message }),
    });
  };

  const handleCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkInMutation.mutate(Number(id), {
      onSuccess: () =>
        showDialog({ variant: "success", title: t("checkedIn"), message: t("patientCheckedInMessage") }),
      onError: (err) =>
        showDialog({ variant: "error", title: t("error"), message: err.message }),
    });
  };

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = () => {
    Haptics.selectionAsync();
    setCancelReason("");
    setCancelError(null);
    setCancelOpen(true);
  };

  const performCancel = () => {
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelError(t("cancelReasonRequired"));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelMutation.mutate(
      { id: Number(id), reason },
      {
        onSuccess: () => {
          setCancelOpen(false);
          showDialog({ variant: "success", title: t("canceled"), message: t("appointmentCanceledMessage") });
        },
        onError: (err) => {
          setCancelOpen(false);
          showDialog({ variant: "error", title: t("error"), message: err.message });
        },
      },
    );
  };

  const careTeam = record?.careTeam ?? [];
  const typeColor =
    record?.type === "Emergency" ? "#EF4444" :
      record?.type === "Consultation" ? "#6366F1" :
        record?.type === "Break" ? "#9CA3AF" : Colors.primary;

  // ── App-bar always visible — body switches between skeleton/error/empty/content ──
  const renderHeader = () => (
    <View style={[s.headerBar, { paddingTop: topPad }]}>
      <Pressable onPress={() => router.back()} style={s.backBtn}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </Pressable>
      <Text style={[s.headerTitle, { color: colors.text, flex: 1 }]}>{t("appointmentDetails")}</Text>
    </View>
  );

  if (isLoading || isFetching || refreshing) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <ScreenBackground />
        {renderHeader()}
        <AppointmentDetailSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <ScreenBackground />
        {renderHeader()}
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <ScreenBackground />
        {renderHeader()}
        <EmptyState
          icon="calendar"
          title={t("appointmentNotFound")}
          description={t("appointmentNotFoundDescription")}
          actionLabel={t("goBack")}
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScreenBackground />
      <FeedbackDialog {...dialogProps} />
      <Modal
        visible={cancelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !cancelMutation.isPending && setCancelOpen(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => !cancelMutation.isPending && setCancelOpen(false)}
        >
          <Pressable
            style={[s.modalCard, { backgroundColor: colors.card }]}
            onPress={() => {}}
          >
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {t("cancelAppointment")}
            </Text>
            <Text style={[s.modalMessage, { color: colors.textSecondary }]}>
              {t("cancelAppointmentConfirm")}
            </Text>
            <Text style={[s.modalLabel, { color: colors.textSecondary }]}>
              {t("cancelReason")}
              <Text style={{ color: "#EF4444" }}> *</Text>
            </Text>
            <TextInput
              value={cancelReason}
              onChangeText={(v) => { setCancelReason(v); if (cancelError) setCancelError(null); }}
              placeholder={t("cancelReasonPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              style={[
                s.modalInput,
                {
                  color: colors.text,
                  borderColor: cancelError ? "#EF4444" : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />
            {cancelError ? (
              <Text style={s.modalError}>{cancelError}</Text>
            ) : null}
            <View style={s.modalActions}>
              <CustomButton
                onPress={() => setCancelOpen(false)}
                title={t("no")}
                variant="outlined"
                color={colors.border}
                textColor={colors.text}
                enable={!cancelMutation.isPending}
                style={{ flex: 1 }}
              />
              <CustomButton
                onPress={performCancel}
                title={t("yesCancel")}
                color="#EF4444"
                loading={cancelMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={{
          padding: horizontal,
          // The bottom action bar can stack two buttons (Confirm + Cancel) on
          // New/Confirmed states; reserve extra room so the last care-team
          // member isn't hidden behind it.
          paddingBottom: botPad + (
            status === AppointmentStatus.New || status === AppointmentStatus.Confirmed
              ? 70
              : 0
          ),
          gap,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ─── Patient Hero ───────────────────────────────────────────── */}
        {patientRecord && (
          <Animated.View entering={FadeInDown.delay(30).springify()}>
            <PatientCard patient={patientRecord} />
          </Animated.View>
        )}

        {/* ─── Appointment Summary ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <SectionHeader title={t("appointmentInfo")} />
          <Card style={s.summaryCard}>
            {/* Top: type (left) + status (right) */}
            <View style={s.topRow}>
              <View style={[s.typeBadge, { backgroundColor: `${typeColor}15` }]}>
                <View style={[s.typeDot, { backgroundColor: typeColor }]} />
                <Text style={[s.typeText, { color: typeColor }]}>{record.type}</Text>
              </View>
              <StatusBadge status={status} label={appointmentStatusLabel(status, t)} />
            </View>

            <View style={s.divider} />

            {/* Date (left) + Time (right) */}
            <View style={s.infoGrid}>
              <View style={s.infoItem}>
                <Feather name="calendar" size={14} color={Colors.primary} />
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{t("date")}</Text>
                <Text style={[s.infoValue, { color: colors.text }]}>{record.visitDate || t("today")}</Text>
              </View>
              <View style={s.infoItem}>
                <Feather name="clock" size={14} color={Colors.primary} />
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{t("time")}</Text>
                <Text style={[s.infoValue, { color: colors.text }]}>{record.time} - {record.endTime}</Text>
              </View>
            </View>

            {/* Instructions */}
            {record.instructions ? (
              <>
                <View style={s.divider} />
                <View style={s.instructionsBlock}>
                  <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{t("instructions")}</Text>
                  <Text style={[s.notesText, { color: colors.text }]}>{record.instructions}</Text>
                </View>
              </>
            ) : null}
          </Card>
        </Animated.View>


        {/* ─── Care Team ─────────────────────────────────────────────── */}
        <View style={{ opacity: 0.7 }}>
          <CareTeamView
            animDelay={150}
            members={careTeam}
            confirmedLabel={t("confirmed")}
            onConfirmMember={
              canConfirmForOthers && status === AppointmentStatus.New
                ? (member) => {
                    if (member.id == null) return;
                    confirmForNurseMutation.mutate(
                      { slotId: Number(id), nurseId: member.id },
                      {
                        onSuccess: () =>
                          showDialog({ variant: "success", title: t("confirmed"), message: t("appointmentConfirmedMessage") }),
                        onError: (err) =>
                          showDialog({ variant: "error", title: t("error"), message: err.message }),
                      },
                    );
                  }
                : undefined
            }
            confirmingMemberId={
              confirmForNurseMutation.isPending
                ? confirmForNurseMutation.variables?.nurseId ?? null
                : null
            }
          />
        </View>

        {/* ─── Additional Info ────────────────────────────────────────── */}
        {/* <Animated.View entering={FadeInDown.delay(200).springify()}>
          <SectionHeader title={t("appointmentInfo")} />
          <Card>
            <View style={s.detailRow}>
              <Feather name="user" size={16} color={Colors.primary} />
              <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{t("provider")}</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{(record as any).provider || "—"}</Text>
            </View>
            <View style={[s.thinDivider, { backgroundColor: colors.borderLight }]} />
            <View style={s.detailRow}>
              <Feather name="watch" size={16} color={Colors.primary} />
              <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{t("visitTimeLabel")}</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{record.visitTime || "—"}</Text>
            </View>
            <View style={[s.thinDivider, { backgroundColor: colors.borderLight }]} />
            <View style={s.detailRow}>
              <Feather name="clock" size={16} color={Colors.primary} />
              <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{t("doctorTime")}</Text>
              <Text style={[s.detailValue, { color: colors.text }]}>{record.doctorTime || "—"}</Text>
            </View>
          </Card>
        </Animated.View> */}
      </ScrollView>

      {/* ─── Bottom Action Button ─────────────────────────────────────── */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: `${colors.card}${CARD_BG_ALPHA}`, borderTopColor: colors.borderLight, gap: 10 }]}>
        {status === AppointmentStatus.New && (
          <CustomButton
            onPress={handleConfirm}
            title={t("confirmAppointment")}
            icon="check"
            loading={confirmMutation.isPending}
          />
        )}
        {status === AppointmentStatus.Confirmed && (
          <CustomButton
            onPress={handleCheckIn}
            title={t("checkIn")}
            icon="log-in"
            color="#22C55E"
            loading={checkInMutation.isPending}
          />
        )}
        {(status === AppointmentStatus.New
          || status === AppointmentStatus.Pending
          || status === AppointmentStatus.Confirmed) && (
          <RuleGate action="cancel_appointment">
            <CustomButton
              onPress={handleCancel}
              title={t("cancelAppointment")}
              icon="x"
              color="#FEE2E2"
              textColor="#B91C1C"
              loading={cancelMutation.isPending}
            />
          </RuleGate>
        )}
        {status === AppointmentStatus.CheckedIn && (() => {
          const rawVisitId =
            (record as any)?.visit_id ?? (record as any)?.visitId ?? null;
          if (rawVisitId == null) return null;
          return (
            <CustomButton
              onPress={() => {
                router.push({
                  pathname: "/visits/[id]",
                  params: { id: String(rawVisitId) },
                });
              }}
              title={t("viewVisit")}
              icon="external-link"
            />
          );
        })()}
        {status === AppointmentStatus.NoShow && (
          <CustomButton
            onPress={() => {}}
            enable={false}
            title={t("noShow")}
            icon="user-x"
            color="#F1F5F9"
            textColor="#64748B"
          />
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

  summaryCard: { padding: 16, gap: 12, opacity: 0.7 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  instructionsBlock: { gap: 4 },
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  modalInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  modalError: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#EF4444",
    marginTop: -4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

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
  memberPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberPickerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  memberPickerRole: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
