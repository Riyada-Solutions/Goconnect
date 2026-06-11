import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { CareTeamView } from "@/components/common/CareTeamView";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useSlot } from "@/hooks/useScheduler";
import { useCheckoutVisit, useEndVisit, useSaveProcedureTimes, useStartVisit, useSubmitDoctorProgressNote, useSubmitInventoryUsage, useSubmitMedicationAdministration, useSubmitMorseFallsRiskAssessment, useSubmitNursingProgressNote, useSubmitReferral, useSubmitRefusal, useSubmitSariScreening, useSubmitSocialWorkerProgressNote, useVisit } from "@/hooks/useVisits";
import { useTheme } from "@/hooks/useTheme";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import type { InventoryItem } from "@/data/models/visit";
import type { CareTeamMember } from "@/data/models/careTeam";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useVisitTimers } from "@/hooks/useVisitTimers";
import { DateTimeConverter } from "@/utils/datetime";
import { PatientCard } from "@/components/common/PatientCard";
import { VisitDetailTopBar } from "./components/VisitDetailTopBar";
import { CheckOutConfirmModal } from "./components/visitForms/CheckOutConfirmModal";
import { FlowSheetForm } from "./components/visitForms/FlowSheetForm";
import { ProgressNoteGroup } from "./components/visitForms/ProgressNoteGroup";
import { ReferralForm } from "./components/visitForms/ReferralForm";
import { RefusalForm } from "./components/visitForms/RefusalForm";
import { parseDisOfHemodialysis } from "@/data/transform/disOfHemodialysis";
import { SariScreeningForm } from "./components/visitForms/SariScreeningForm";
import { MorseFallScaleSheet } from "./components/visitForms/MorseFallScaleSheet";
import { NurseSignatureSheet } from "./components/NurseSignatureSheet";
import { ReadOnlyBanner } from "./components/visitForms/ReadOnlyBanner";
import { PatientAlertsCard } from "./components/visitForms/PatientAlertsCard";
import { PatientInventorySection } from "./components/visitForms/PatientInventorySection";
import { PatientSignatureSheet } from "./components/visitForms/PatientSignatureSheet";
import { PhysicianCallModal } from "./components/visitForms/PhysicianCallModal";
import { UseItemsModal } from "./components/visitForms/UseItemsModal";
import { VisitDetailEmpty, VisitDetailError } from "./components/VisitDetailStates";
import { VisitDetailSkeleton } from "./components/VisitDetailSkeleton";
import { VisitInfoCard } from "./components/VisitInfoCard";
import { WorkflowActionButtons } from "./components/visitForms/WorkflowActionButtons";
import { visitDetailStyles as s } from "./visit-detail.styles";



// ═══════════════════════════════════════════════════════════════════════════════
export default function VisitDetailScreen() {
  return (
    <ErrorBoundary>
      <VisitDetailScreenInner />
    </ErrorBoundary>
  );
}

function VisitDetailScreenInner() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const { t, user, can } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad } = useScreenPadding({ hasActionBar: true });
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const isSlot = mode === "slot";
  const numId = Number(id);
  const slotQuery = useSlot(isSlot ? numId : 0);
  const visitQuery = useVisit(!isSlot ? numId : 0);
  const activeQuery = isSlot ? slotQuery : visitQuery;
  const record = activeQuery.data;

  // Stable refusal prefill — parsed once per unique raw payload so that
  // user edits in RefusalForm aren't clobbered on every re-render by the
  // form's `useEffect([initial])` reset.
  const refusalInitial = useMemo(() => {
    const rec = record as any;
    const forms = rec?.forms;
    const fromMap = forms && !Array.isArray(forms)
      ? forms["dis-of-hemodialysis"]?.[0]?.value
      : undefined;
    const fromArray = Array.isArray(rec?.refusals) ? rec.refusals[0] : undefined;
    const top = rec?.["dis-of-hemodialysis"] ?? rec?.disOfHemodialysis;
    const fromTop = top && typeof top === "object" && !Array.isArray(top)
      ? top
      : Array.isArray(top)
        ? top[0]
        : undefined;
    const raw = fromMap ?? fromArray ?? fromTop;
    return raw && Object.keys(raw).length > 0
      ? parseDisOfHemodialysis(raw)
      : null;
  }, [
    (record as any)?.["dis-of-hemodialysis"],
    (record as any)?.disOfHemodialysis,
    (record as any)?.forms?.["dis-of-hemodialysis"]?.[0]?.value,
    (record as any)?.refusals,
  ]);

  const isLoading = activeQuery.isLoading || activeQuery.isFetching;
  const isError = activeQuery.isError;
  const errorMessage = activeQuery.error instanceof Error ? activeQuery.error.message : "Something went wrong.";
  const refetch = () => activeQuery.refetch();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  type VisitPhase = "in_progress" | "start_procedure" | "end_procedure" | "completed";
  const recordStatus = record?.status as string | undefined;
  const initialPhase: VisitPhase =
    recordStatus === "completed"
      ? "completed"
      : recordStatus === "start_procedure"
        ? "start_procedure"
        : recordStatus === "end_procedure"
          ? "end_procedure"
          : "in_progress";
  const [visitPhase, setVisitPhase] = useState<VisitPhase>(initialPhase);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [procedureStartTimeStr, setProcedureStartTimeStr] = useState("--:-- --");
  const [procedureEndTimeStr, setProcedureEndTimeStr] = useState("--:-- --");
  const [showProcedureEdit, setShowProcedureEdit] = useState(false);
  const [editProcStart, setEditProcStart] = useState("");
  const [editProcEnd, setEditProcEnd] = useState("");

  const isReadOnly = visitPhase === "completed";

  // Sync the local phase forward to the server status once the visit loads
  // (the query resolves async, so a visit already in `start_procedure` would
  // otherwise stay stuck at the initial `in_progress`). Forward-only so an
  // optimistic local advance isn't reverted before its mutation round-trips.
  const PHASE_RANK: Record<VisitPhase, number> = {
    in_progress: 0, start_procedure: 1, end_procedure: 2, completed: 3,
  };
  useEffect(() => {
    setVisitPhase((prev) => (PHASE_RANK[initialPhase] > PHASE_RANK[prev] ? initialPhase : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhase]);

  // The Flow Sheet records the dialysis treatment itself, so it locks as soon
  // as the nurse ends the procedure — earlier than the rest of the screen,
  // which stays editable until checkout (`completed`).
  const isFlowSheetLocked = PHASE_RANK[visitPhase] >= PHASE_RANK.end_procedure;

  const { visitElapsed, procedureElapsed } = useVisitTimers(visitPhase, {
    visitStart: (record as any)?.startTime,
    visitEnd: (record as any)?.endTime,
    procedureStart: (record as any)?.startProcedureTime,
    procedureEnd: (record as any)?.endProcedureTime,
  });

  const startVisitMutation = useStartVisit(numId);
  const endVisitMutation = useEndVisit(numId);
  const checkoutVisitMutation = useCheckoutVisit(numId);
  const saveProcedureTimesMutation = useSaveProcedureTimes(numId);
  const submitInventoryUsageMutation = useSubmitInventoryUsage(numId);

  const handleStartProcedure = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisitPhase("start_procedure");
    const now = Date.now();
    setProcedureStartTimeStr(DateTimeConverter.time(now));
    setEditProcStart(DateTimeConverter.time(now));
    startVisitMutation.mutate();
  }, [startVisitMutation]);

  const handleEndProcedure = useCallback(() => {
    const meds: any[] = (record as any)?.flowSheet?.dialysisMedications ?? [];
    const pending = meds.filter((m: any) => m?.administered?.data?.action == null);
    if (pending.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showDialog({
        variant: "error",
        title: t("endProcedureMedsPendingTitle"),
        message: `${t("endProcedureMedsPendingMessage")}\n${pending.length} ${t("endProcedureMedsPendingCount")}`,
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setVisitPhase("end_procedure");
    setProcedureEndTimeStr(DateTimeConverter.time(new Date()));
    setEditProcEnd(DateTimeConverter.time(new Date()));
    endVisitMutation.mutate();
  }, [endVisitMutation, record, showDialog, t]);

  const handleCheckOut = useCallback(() => {
    setShowCheckoutModal(false);
    setVisitPhase("completed");
    checkoutVisitMutation.mutate(undefined, {
      onError: (err) => {
        // Roll back to the pre-checkout phase so the nurse can retry.
        setVisitPhase("end_procedure");
        showDialog({
          variant: "error",
          title: t("error"),
          message: err instanceof Error ? err.message : t("error"),
        });
      },
    });
  }, [checkoutVisitMutation, showDialog, t]);

  // Collapsible states
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  // ── Morse Fall Scale state ──────────────────────────────────────────────────
  const [morseSheetOpen, setMorseSheetOpen] = useState(false);
  const [morseA, setMorseA] = useState<number | null>(null); // History of Falling: 0|25
  const [morseB, setMorseB] = useState<number | null>(null); // Secondary Diagnosis: 0|15
  const [morseC, setMorseC] = useState<number | null>(null); // Ambulatory Aid: 0|15|30
  const [morseD, setMorseD] = useState<number | null>(null); // IV Therapy: 0|20
  const [morseE, setMorseE] = useState<number | null>(null); // Gait/Transfer: 0|10|20
  const [morseF, setMorseF] = useState<number | null>(null); // Mental Status: 0|15
  const [morseActions, setMorseActions] = useState<Record<string, boolean>>({});
  const morseTotal = (morseA ?? 0) + (morseB ?? 0) + (morseC ?? 0) + (morseD ?? 0) + (morseE ?? 0) + (morseF ?? 0);
  const morseComplete = morseA !== null && morseB !== null && morseC !== null && morseD !== null && morseE !== null && morseF !== null;
  const [physicianModalOpen, setPhysicianModalOpen] = useState(false);
  const [physicianCalled, setPhysicianCalled] = useState<"yes" | "no" | null>(null);
  const [pendingPhysicianModal, setPendingPhysicianModal] = useState(false);
  const [signatureSheetOpen, setSignatureSheetOpen] = useState(false);
  const [patientSigned, setPatientSigned] = useState(false);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [nurseSignatureSheetOpen, setNurseSignatureSheetOpen] = useState(false);
  const [nurseSigned, setNurseSigned] = useState(false);
  const [nurseSignatureConfirmed, setNurseSignatureConfirmed] = useState(false);

  // Seed Morse values + recommended actions from the loaded flowSheet.
  // Re-hydrates on every server-side change (new visit, refetch after save,
  // pull-to-refresh) so the Fall Risk summary and Morse sheet always reflect
  // the persisted state. We skip while the sheet is open to avoid clobbering
  // the user's in-progress edits.
  const mv = (record as any)?.flowSheet?.morseValues;
  const macts = (record as any)?.flowSheet?.morseActions;
  useEffect(() => {
    if (morseSheetOpen) return;
    if (mv) {
      setMorseA(mv.a ?? null);
      setMorseB(mv.b ?? null);
      setMorseC(mv.c ?? null);
      setMorseD(mv.d ?? null);
      setMorseE(mv.e ?? null);
      setMorseF(mv.f ?? null);
    }
    if (macts && typeof macts === 'object') {
      setMorseActions(macts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    record?.id,
    mv?.a, mv?.b, mv?.c, mv?.d, mv?.e, mv?.f,
    // Re-key when actions hash changes (count of true keys is a good-enough fingerprint).
    macts ? Object.keys(macts).filter((k) => macts[k]).sort().join('|') : null,
  ]);

  // Seed the procedure clock strings from the server timestamps
  // (`start_procedure_time` / `end_procedure_time`) so they survive reloads —
  // the nurse may not have tapped Start/End Procedure this session. Skipped
  // while the inline editor is open so we don't clobber in-progress edits.
  const startProcedureTime = (record as any)?.startProcedureTime as string | null | undefined;
  const endProcedureTime = (record as any)?.endProcedureTime as string | null | undefined;
  useEffect(() => {
    if (showProcedureEdit) return;
    if (startProcedureTime) {
      const str = DateTimeConverter.time(startProcedureTime);
      setProcedureStartTimeStr(str);
      setEditProcStart(str);
    }
    if (endProcedureTime) {
      const str = DateTimeConverter.time(endProcedureTime);
      setProcedureEndTimeStr(str);
      setEditProcEnd(str);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startProcedureTime, endProcedureTime]);

  // Open physician modal only after Morse sheet has fully closed
  useEffect(() => {
    if (!morseSheetOpen && pendingPhysicianModal) {
      setPendingPhysicianModal(false);
      const t = setTimeout(() => setPhysicianModalOpen(true), 300);
      return () => clearTimeout(t);
    }
  }, [morseSheetOpen, pendingPhysicianModal]);

  // Dialysis Medications administered state.
  //
  // The canonical persisted state lives on `med.administered` (set by
  // `POST /actions/patient-medications/{id}`). `medAdmin` here is just a
  // transient map used to display optimistic UI before the refetch lands.
  const [medAdmin, setMedAdmin] = useState<Record<number, { status: "yes" | "no" | null; timestamp: string; reason: string }>>({});
  const [medBusyIds, setMedBusyIds] = useState<Set<number>>(new Set());
  const submitMedAdministration = useSubmitMedicationAdministration(numId);
  const handleMedAction = useCallback((medId: number, action: "yes" | "no", reason?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Optimistic local state so the row reflects the user's tap immediately.
    setMedAdmin((prev) => ({
      ...prev,
      [medId]: { status: action, timestamp: new Date().toLocaleString(), reason: reason ?? "" },
    }));
    setMedBusyIds((prev) => { const next = new Set(prev); next.add(medId); return next; });
    submitMedAdministration.mutate(
      {
        medicationId: medId,
        action: action === "yes" ? 1 : 0,
        reason: action === "no" ? (reason ?? "") : null,
      },
      {
        onSettled: () => {
          setMedBusyIds((prev) => { const next = new Set(prev); next.delete(medId); return next; });
        },
        onError: (err) =>
          showDialog({
            variant: "error",
            title: t("error"),
            message: err instanceof Error ? err.message : t("error"),
          }),
      },
    );
  }, [submitMedAdministration, showDialog, t]);

  // Inventory modal — medications + inventory now ride on Visit (single source of truth).
  const [useModalVisible, setUseModalVisible] = useState(false);
  const medications = (record as any)?.flowSheet?.dialysisMedications ?? [];
  const inventoryData: InventoryItem[] = (record as any)?.inventory ?? [];
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Progress Notes — `Visit.progressNotes` ships three buckets but the backend
  // sometimes dumps every kind into `doctor` regardless of `type`. We also see
  // a mix of legacy (`note`) and new (`notes`) field names per row. Normalize
  // both: derive a guaranteed-string `note`, then route social_worker rows out
  // of the doctor bucket.
  const progressNotes = (record as any)?.progressNotes;
  const normalizeNote = (n: any) => {
    if (!n || typeof n !== 'object') return n;
    return { ...n, note: String(n.note ?? n.notes ?? '') };
  };
  const rawNursing      = (progressNotes?.nursing       ?? []).map(normalizeNote);
  const rawDoctorBucket = (progressNotes?.doctor        ?? []).map(normalizeNote);
  const rawSocialBucket = (progressNotes?.socialWorker  ?? []).map(normalizeNote);
  const nursingProgressNotes      = rawNursing;
  const doctorProgressNotes       = rawDoctorBucket.filter((n: any) => n?.type !== 'social_worker');
  const socialWorkerProgressNotes = [
    ...rawSocialBucket,
    ...rawDoctorBucket.filter((n: any) => n?.type === 'social_worker'),
  ];
  const submitNursingProgressNote = useSubmitNursingProgressNote(numId);
  const submitSocialWorkerProgressNote = useSubmitSocialWorkerProgressNote(numId);
  const submitReferral = useSubmitReferral(numId);
  const submitDoctorProgressNote = useSubmitDoctorProgressNote(numId);
  const submitRefusal = useSubmitRefusal(numId);
  const submitSariScreening = useSubmitSariScreening(numId);
  const submitMorseFallsRisk = useSubmitMorseFallsRiskAssessment(numId);
  // preTreatmentVitals now lives inside flowSheet (single source of truth).
  const preTreatmentVitals = (record as any)?.flowSheet?.preTreatmentVitals;

  // Patient + alerts ride on the visit response (single source of truth).
  // The backend nests alerts inside `patient.patientAlerts`; keep the
  // top-level fallback for older payloads.
  const patientRecord = (record as any)?.patient ?? null;
  const patientAlertsData =
    patientRecord?.patientAlerts ?? (record as any)?.patientAlerts ?? null;

  useEffect(() => {
    if (inventoryData.length > 0 && inventoryItems.length === 0) {
      setInventoryItems(inventoryData.map((i) => ({ ...i })));
    }
  }, [inventoryData]);

  // App-bar always visible — body switches between skeleton/error/empty/content.
  if ((isLoading && !record) || refreshing) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <VisitDetailTopBar topPad={topPad} colors={colors} />
        <VisitDetailSkeleton colors={colors} />
      </View>
    );
  }
  if (isError) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <VisitDetailTopBar topPad={topPad} colors={colors} />
        <VisitDetailError colors={colors} message={errorMessage} onRetry={refetch} />
      </View>
    );
  }
  if (!record) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <VisitDetailTopBar topPad={topPad} colors={colors} />
        <VisitDetailEmpty colors={colors} onRetry={refetch} />
      </View>
    );
  }

  const careTeam = (record as any).careTeam ?? [];
  const patientName = (patientRecord?.name ?? (record as any).patientName) as string | undefined;
  const alerts = patientAlertsData;

  const visitDate = (record as any).visitDate as string | undefined;
  const procedureTime = (record as any).procedureTime as string | undefined;
  // Visit Time shows the actual visit start (`start_time`), like the web view.
  const visitTime =
    ((record as any).startTime
      ? DateTimeConverter.time((record as any).startTime)
      : (record as any).visitTime) as string | undefined;
  // Hospital and insurance live on the embedded patient record.
  const hospital = (patientRecord?.hospital ?? (record as any).hospital) as string | undefined;
  const insurance = (patientRecord?.insuranceCompany ?? (record as any).insurance) as string | undefined;
  // Doctor Time from the doctor check-in/out timestamps; "Not started" while
  // the doctor hasn't checked in yet (both null).
  const doctorCheckInTime = (record as any).doctorCheckInTime as string | null | undefined;
  const doctorCheckOutTime = (record as any).doctorCheckOutTime as string | null | undefined;
  const doctorTime = doctorCheckInTime
    ? DateTimeConverter.time(doctorCheckInTime) +
      (doctorCheckOutTime ? ` – ${DateTimeConverter.time(doctorCheckOutTime)}` : "")
    : "Not started";

  // Providers come from the care team (the visit's own `provider` field is
  // null). Show each member as "role name", primary first.
  const provider =
    (careTeam as CareTeamMember[]).length > 0
      ? [...(careTeam as CareTeamMember[])]
          .sort((a, b) => Number(b.isPrimary ?? false) - Number(a.isPrimary ?? false))
          .map((m) => [m.role, m.name].filter(Boolean).join(" "))
          .filter(Boolean)
          .join(", ")
      : ((record as any).provider as string | undefined);

  // Primary physician = the care-team member flagged isPrimary (by name).
  const primaryPhysician =
    (careTeam as CareTeamMember[]).find((m) => m.isPrimary)?.name ?? "Physician";

  const alertCount =
    (alerts?.allergies?.length ?? 0) +
    (alerts?.contamination?.length ?? 0) +
    (alerts?.instructions ? 1 : 0) +
    (alerts?.isolation ? 1 : 0);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <FeedbackDialog {...dialogProps} />
      <VisitDetailTopBar topPad={topPad} colors={colors} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
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
          <Animated.View entering={FadeInDown.delay(30).springify()} style={[s.section,{ marginTop: 16 }]}>
            <PatientCard patient={patientRecord} />
          </Animated.View>
        )}

        <View style={s.sectionHeader}>
          <SectionHeader title={t("visitInfo")} />
        </View>
        
        <VisitInfoCard
          visitId={(record as any)?.id ?? numId}
          visitDate={visitDate || (record as any).date}
          visitTime={visitTime || (record as any).time}
          procedureTime={procedureTime}
          patientName={patientName}
          hospital={hospital}
          insurance={insurance}
          provider={provider}
          doctorTime={doctorTime}
          visitPhase={visitPhase}
          visitElapsed={visitElapsed}
          procedureElapsed={procedureElapsed}
          procedureStartTimeStr={procedureStartTimeStr}
          procedureEndTimeStr={procedureEndTimeStr}
          showProcedureEdit={showProcedureEdit}
          editProcStart={editProcStart}
          editProcEnd={editProcEnd}
          isReadOnly={isReadOnly}
          colors={colors}
          onToggleProcedureEdit={() => setShowProcedureEdit((v) => !v)}
          onEditProcStartChange={setEditProcStart}
          onEditProcEndChange={setEditProcEnd}
          onSaveProcedureTimes={() => {
            if (editProcStart) setProcedureStartTimeStr(editProcStart);
            if (editProcEnd) setProcedureEndTimeStr(editProcEnd);
            setShowProcedureEdit(false);
            saveProcedureTimesMutation.mutate({
              startTime: editProcStart || undefined,
              endTime: editProcEnd || undefined,
            });
          }}
        />
        {isReadOnly && <ReadOnlyBanner />}

        {alerts && alertCount > 0 && (
          <PatientAlertsCard alerts={alerts} expanded={alertsOpen} onToggle={() => setAlertsOpen(!alertsOpen)} colors={colors} />
        )}
        {/* ─── Care Team ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <CareTeamView animDelay={140} members={careTeam} />
        </View>

        <View style={s.sectionHeader}>
          <SectionHeader title="Forms" />
        </View>
        {/* ─── Flow Sheet Mobile ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(215).springify()} style={s.section}>
          <FlowSheetForm
            colors={colors}
            isReadOnly={isFlowSheetLocked}
            // initialExpanded={initialPhase === "completed"}
            visitId={numId}
            initial={(record as any)?.flowSheet}
            key={(record as any)?.flowSheet?.submittedAt ?? "new"}
            medications={medications}
            medAdmin={medAdmin}
            medBusyIds={medBusyIds}
            onMedAction={handleMedAction}
            morseTotal={morseTotal}
            morseComplete={morseComplete}
            morseValues={{ a: morseA, b: morseB, c: morseC, d: morseD, e: morseE, f: morseF }}
            physicianCalled={physicianCalled}
            onOpenMorseSheet={() => setMorseSheetOpen(true)}
            onRequestPhysicianCall={() => { setPhysicianCalled(null); setTimeout(() => setPhysicianModalOpen(true), 150); }}
          />
        </Animated.View>

        {/* ─── Progress Note (Doctor / Nursing / Social Worker) ───────────── */}
        <Animated.View entering={FadeInDown.delay(222).springify()} style={s.section}>
          <ProgressNoteGroup
            colors={colors}
            isReadOnly={isReadOnly}
            canSubmitDoctor={can("submit_doctor_progress_note")}
            canSubmitNursing={can("submit_nursing_progress_note")}
            canSubmitSocial={can("submit_social_worker_progress_note")}
            // initialExpanded={initialPhase === "completed"}
            doctorVitals={preTreatmentVitals}
            doctorNotes={doctorProgressNotes}
            onSaveDoctor={(input) => {
              submitDoctorProgressNote.mutate(input, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("doctorProgressNote") }),
                onError: (err: unknown) => showDialog({ variant: "error", title: t("error"), message: err instanceof Error ? err.message : t("error") }),
              });
            }}
            nursingNotes={nursingProgressNotes}
            onSaveNursing={(note) => {
              submitNursingProgressNote.mutate(note, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("nursingProgressNote") }),
                onError: (err: unknown) => showDialog({ variant: "error", title: t("error"), message: err instanceof Error ? err.message : t("error") }),
              });
            }}
            socialWorkerNotes={socialWorkerProgressNotes}
            onSaveSocialWorker={(input) => {
              submitSocialWorkerProgressNote.mutate(input, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("socialWorkerProgressNote") }),
                onError: (err: unknown) => showDialog({ variant: "error", title: t("error"), message: err instanceof Error ? err.message : t("error") }),
              });
            }}
            t={t}
          />
        </Animated.View>

        {/* ─── Referral ────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(228).springify()} style={s.section}>
          <ReferralForm
            colors={colors}
            isReadOnly={isReadOnly}
            // initialExpanded={initialPhase === "completed"}
            visitId={numId}
            primaryPhysician={primaryPhysician}
            referralBy={user?.name ?? ""}
            previousReferrals={(record as any)?.referrals ?? []}
            onSave={(data) => {
              submitReferral.mutate(data, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("referral") }),
                onError: (err: unknown) => showDialog({ variant: "error", title: t("error"), message: err instanceof Error ? err.message : t("error") }),
              });
            }}
            t={t}
          />
        </Animated.View>

        {/* ─── Refusal / Discontinuation ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(235).springify()} style={s.section}>
          <RefusalForm
            colors={colors}
            isReadOnly={isReadOnly}
            initialExpanded={false}
            isSaving={submitRefusal.isPending}
            initial={refusalInitial}
            onSave={(data) => {
              const currentUserId = Number(user?.id);
              if (!Number.isFinite(currentUserId)) {
                showDialog({ variant: "error", title: t("error"), message: "Missing user id" });
                return;
              }
              submitRefusal.mutate({ ...data, currentUserId }, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("refusalTitle") }),
                onError: (err: unknown) => showDialog({ variant: "error", title: t("error"), message: err instanceof Error ? err.message : t("error") }),
              });
            }}
            t={t}
          />
        </Animated.View>

        {/* ─── SARI Screening Tool ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(238).springify()} style={s.section}>
          <SariScreeningForm
            colors={colors}
            isReadOnly={isReadOnly}
            initialExpanded={false}
            defaultPatientName={(record as any)?.patientName}
            initial={(record as any)?.sariScreenings?.[0] ?? null}
            key={(record as any)?.sariScreenings?.[0]?.createdAt ?? "sari-new"}
            isSaving={submitSariScreening.isPending}
            onSave={(data) => {
              submitSariScreening.mutate(data, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("sariScreeningTool") }),
                onError: (err: unknown) => showDialog({ variant: "error", title: t("error"), message: err instanceof Error ? err.message : t("error") }),
              });
            }}
            t={t}
          />
        </Animated.View>

        <PatientInventorySection
          items={inventoryItems}
          expanded={inventoryOpen}
          onToggle={() => setInventoryOpen(!inventoryOpen)}
          onSelectItem={(item) => { setSelectedItem(item); setUseModalVisible(true); }}
          isReadOnly={isReadOnly}
          colors={colors}
        />
        {/* {patientName && ( */}
          <WorkflowActionButtons
            phase={visitPhase}
            onStartProcedure={handleStartProcedure}
            onEndProcedure={handleEndProcedure}
            onCheckOut={() => setShowCheckoutModal(true)}
          />
        {/* )} */}
      </ScrollView>

      <MorseFallScaleSheet
        visible={morseSheetOpen}
        morseTotal={morseTotal}
        morseA={morseA} morseB={morseB} morseC={morseC}
        morseD={morseD} morseE={morseE} morseF={morseF}
        morseActions={morseActions}
        setMorseA={setMorseA} setMorseB={setMorseB} setMorseC={setMorseC}
        setMorseD={setMorseD} setMorseE={setMorseE} setMorseF={setMorseF}
        setMorseActions={setMorseActions}
        colors={colors}
        onSave={async () => {
          // The morse sheet handles its own busy/error UI — let mutateAsync
          // throw on failure so the sheet stays open with the error visible.
          await submitMorseFallsRisk.mutateAsync({
            morseValues: { a: morseA, b: morseB, c: morseC, d: morseD, e: morseE, f: morseF },
            morseTotal,
            morseActions,
          });
          if (morseTotal > 3) { setPhysicianCalled(null); setPendingPhysicianModal(true); }
        }}
        onClose={() => setMorseSheetOpen(false)}
      />
      <PatientSignatureSheet
        visible={signatureSheetOpen}
        confirmed={signatureConfirmed}
        onConfirmedChange={setSignatureConfirmed}
        onSign={() => { setPatientSigned(true); setSignatureSheetOpen(false); }}
        onClose={() => setSignatureSheetOpen(false)}
        colors={colors}
      />
      <NurseSignatureSheet
        visible={nurseSignatureSheetOpen}
        confirmed={nurseSignatureConfirmed}
        onConfirmedChange={setNurseSignatureConfirmed}
        onSign={() => { setNurseSigned(true); setNurseSignatureSheetOpen(false); }}
        onClose={() => setNurseSignatureSheetOpen(false)}
        colors={colors}
      />
      <PhysicianCallModal
        visible={physicianModalOpen}
        physicianCalled={physicianCalled}
        onChange={setPhysicianCalled}
        onSave={() => setPhysicianModalOpen(false)}
        onClose={() => setPhysicianModalOpen(false)}
        colors={colors}
      />
      <CheckOutConfirmModal
        visible={showCheckoutModal}
        onConfirm={handleCheckOut}
        onCancel={() => setShowCheckoutModal(false)}
      />
      {/* Use Items Modal */}
      <UseItemsModal
        visible={useModalVisible}
        item={selectedItem}
        onClose={() => setUseModalVisible(false)}
        onUse={(qty, notes) => {
          if (!selectedItem) return;
          // Optimistic local deduction so the UI feels instant.
          setInventoryItems((prev) =>
            prev.map((it) =>
              it.id === selectedItem.id
                ? { ...it, available: Math.max(0, it.available - qty) }
                : it,
            ),
          );
          setUseModalVisible(false);
          submitInventoryUsageMutation.mutate(
            { itemId: selectedItem.id, quantity: qty, notes: notes || undefined },
            {
              onSuccess: () =>
                showDialog({ variant: "success", title: "Success", message: `Used ${qty} × ${selectedItem.name}. Inventory updated.` }),
              onError: (err) =>
                showDialog({ variant: "error", title: t("error"), message: err.message }),
            },
          );
        }}
        colors={colors}
      />
    </View>
  );
}

