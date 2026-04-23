import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { CareTeamView } from "@/components/common/CareTeamView";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { usePatient, usePatientAlerts } from "@/hooks/usePatients";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useSlot } from "@/hooks/useScheduler";
import { useVisit, useMedications, useInventory, useSubmitDoctorProgressNote, useSubmitFlowSheet, useSubmitNursingProgressNote, useSubmitReferral, useSubmitRefusal, useSubmitSariScreening, useSubmitSocialWorkerProgressNote } from "@/hooks/useVisits";
import { useTheme } from "@/hooks/useTheme";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import type { InventoryItem } from "@/data/models/visit";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useVisitTimers } from "@/hooks/useVisitTimers";
import { formatClockTime } from "@/utils/time";
import { PatientCard } from "@/components/common/PatientCard";
import { VisitDetailTopBar } from "./components/VisitDetailTopBar";
import { CheckOutConfirmModal } from "./components/visitForms/CheckOutConfirmModal";
import { FlowSheetForm } from "./components/visitForms/FlowSheetForm";
import { ProgressNoteGroup } from "./components/visitForms/ProgressNoteGroup";
import { ReferralForm } from "./components/visitForms/ReferralForm";
import { RefusalForm } from "./components/visitForms/RefusalForm";
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
  const { t } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad } = useScreenPadding({ hasActionBar: true });
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const isSlot = mode === "slot";
  const numId = Number(id);
  const slotQuery = useSlot(isSlot ? numId : 0);
  const visitQuery = useVisit(!isSlot ? numId : 0);
  const activeQuery = isSlot ? slotQuery : visitQuery;
  const record = activeQuery.data;
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

  const { visitElapsed, procedureElapsed, stopVisitTimer, startProcedureTimer, stopProcedureTimer } =
    useVisitTimers(initialPhase);

  const handleStartProcedure = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisitPhase("start_procedure");
    stopVisitTimer();
    const now = Date.now();
    startProcedureTimer(now);
    setProcedureStartTimeStr(formatClockTime(new Date(now)));
    setEditProcStart(formatClockTime(new Date(now)));
  }, [stopVisitTimer, startProcedureTimer]);

  const handleEndProcedure = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setVisitPhase("end_procedure");
    setProcedureEndTimeStr(formatClockTime(new Date()));
    setEditProcEnd(formatClockTime(new Date()));
    stopProcedureTimer();
  }, [stopProcedureTimer]);

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

  // Open physician modal only after Morse sheet has fully closed
  useEffect(() => {
    if (!morseSheetOpen && pendingPhysicianModal) {
      setPendingPhysicianModal(false);
      const t = setTimeout(() => setPhysicianModalOpen(true), 300);
      return () => clearTimeout(t);
    }
  }, [morseSheetOpen, pendingPhysicianModal]);

  // Dialysis Medications administered state
  const [medAdmin, setMedAdmin] = useState<Record<number, { status: "yes" | "no" | null; timestamp: string; reason: string }>>({});
  const handleMedAction = useCallback((medId: number, action: "yes" | "no") => {
    if (action === "no") {
      setMedAdmin((prev) => ({ ...prev, [medId]: { status: "no", timestamp: new Date().toLocaleString(), reason: "Declined" } }));
      showDialog({ variant: "success", title: "Not Administered", message: "Medication marked as not administered." });
    } else {
      setMedAdmin((prev) => ({ ...prev, [medId]: { status: "yes", timestamp: new Date().toLocaleString(), reason: "" } }));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Inventory modal
  const [useModalVisible, setUseModalVisible] = useState(false);
  const { data: medications = [] } = useMedications();
  const { data: inventoryData = [] } = useInventory();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Progress Notes — loaded from visit details response
  const nursingProgressNotes = (record as any)?.nursingProgressNotes ?? [];
  const socialWorkerProgressNotes = (record as any)?.socialWorkerProgressNotes ?? [];
  const submitNursingProgressNote = useSubmitNursingProgressNote(numId);
  const submitSocialWorkerProgressNote = useSubmitSocialWorkerProgressNote(numId);
  const submitReferral = useSubmitReferral(numId);
  const submitDoctorProgressNote = useSubmitDoctorProgressNote(numId);
  const submitRefusal = useSubmitRefusal(numId);
  const submitFlowSheet = useSubmitFlowSheet(numId);
  const submitSariScreening = useSubmitSariScreening(numId);
  const doctorProgressNotes = (record as any)?.doctorProgressNotes ?? [];
  const preTreatmentVitals = (record as any)?.preTreatmentVitals;

  // Must call hooks before any early return (Rules of Hooks)
  const patientId = (record as any)?.patientId as number | undefined;
  const { data: patientRecord } = usePatient(patientId ?? 0);
  const { data: patientAlertsData } = usePatientAlerts(patientId ?? 0);

  useEffect(() => {
    if (inventoryData.length > 0 && inventoryItems.length === 0) {
      setInventoryItems(inventoryData.map((i) => ({ ...i })));
    }
  }, [inventoryData]);

  if ((isLoading && !record) || refreshing) return <VisitDetailSkeleton colors={colors} />;
  if (isError) return <VisitDetailError colors={colors} message={errorMessage} onRetry={refetch} />;
  if (!record) return <VisitDetailEmpty colors={colors} onRetry={refetch} />;

  const careTeam = (record as any).careTeam ?? [];
  const patientName = (record as any).patientName as string | undefined;
  const alerts = patientAlertsData;

  const visitDate = (record as any).visitDate as string | undefined;
  const procedureTime = (record as any).procedureTime as string | undefined;
  const visitTime = (record as any).visitTime as string | undefined;
  const hospital = (record as any).hospital as string | undefined;
  const insurance = (record as any).insurance as string | undefined;
  const doctorTime = (record as any).doctorTime as string | undefined;

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
          <Animated.View entering={FadeInDown.delay(30).springify()} style={s.section}>
            <PatientCard patient={patientRecord} />
          </Animated.View>
        )}

        <View style={s.sectionHeader}>
          <SectionHeader title={t("visitInfo")} />
        </View>
        
        <VisitInfoCard
          visitDate={visitDate || (record as any).date}
          visitTime={visitTime || (record as any).time}
          procedureTime={procedureTime}
          patientName={patientName}
          hospital={hospital}
          insurance={insurance}
          provider={(record as any).provider}
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
            isReadOnly={isReadOnly}
            // initialExpanded={initialPhase === "completed"}
            initial={(record as any)?.flowSheet}
            key={(record as any)?.flowSheet?.submittedAt ?? "new"}
            medications={medications}
            medAdmin={medAdmin}
            onMedAction={handleMedAction}
            morseTotal={morseTotal}
            morseComplete={morseComplete}
            morseValues={{ a: morseA, b: morseB, c: morseC, d: morseD, e: morseE, f: morseF }}
            physicianCalled={physicianCalled}
            onOpenMorseSheet={() => setMorseSheetOpen(true)}
            onRequestPhysicianCall={() => { setPhysicianCalled(null); setTimeout(() => setPhysicianModalOpen(true), 150); }}
            onSave={(data) => {
              const payload = {
                vitals: data.vitals,
                bpSite: data.bpSite,
                method: data.method,
                machine: data.machine,
                pain: data.pain,
                painDetails: data.painDetails,
                fallRisk: data.fallRisk,
                highFallRisk: data.highFallRisk,
                outsideDialysis: data.outsideDialysis,
                alarmsTest: data.alarmsTest,
                nursingActions: data.nursingActions,
                dialysisParams: data.dialysisParams,
                intake: data.intake,
                output: data.output,
                car: data.car,
                dialysate: data.dialysate,
                access: data.access,
                anticoagType: data.anticoagType,
                postTx: data.postTx,
                patientSignature:
                  data.patientSignature.signed && data.patientSignature.dataUrl
                    ? { dataUrl: data.patientSignature.dataUrl, signedAt: data.patientSignature.signedAt ?? new Date().toISOString() }
                    : undefined,
                nurseSignature:
                  data.nurseSignature.signed && data.nurseSignature.dataUrl
                    ? { dataUrl: data.nurseSignature.dataUrl, signedAt: data.nurseSignature.signedAt ?? new Date().toISOString() }
                    : undefined,
                submittedAt: new Date().toISOString(),
              };
              submitFlowSheet.mutate(payload, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: "Flow sheet saved." }),
                onError: (err: unknown) =>
                  showDialog({ variant: "error", title: t("error"), message: err instanceof Error ? err.message : t("error") }),
              });
            }}
          />
        </Animated.View>

        {/* ─── Progress Note (Doctor / Nursing / Social Worker) ───────────── */}
        <Animated.View entering={FadeInDown.delay(222).springify()} style={s.section}>
          <ProgressNoteGroup
            colors={colors}
            isReadOnly={isReadOnly}
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
            primaryPhysician={(record as any)?.provider ?? "Physician"}
            referralBy="Waleed abdelrahman"
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
            onSave={(data) => {
              const primary = data.en.types.length > 0 || data.en.reason.trim() !== "" ? data.en : data.ar;
              submitRefusal.mutate(primary, {
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
        {patientName && (
          <WorkflowActionButtons
            phase={visitPhase}
            onStartProcedure={handleStartProcedure}
            onEndProcedure={handleEndProcedure}
            onCheckOut={() => setShowCheckoutModal(true)}
          />
        )}
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
        onDone={() => {
          if (morseTotal > 3) { setPhysicianCalled(null); setPendingPhysicianModal(true); }
          setMorseSheetOpen(false);
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
        onConfirm={() => { setShowCheckoutModal(false); setVisitPhase("completed"); }}
        onCancel={() => setShowCheckoutModal(false)}
      />
      {/* Use Items Modal */}
      <UseItemsModal
        visible={useModalVisible}
        item={selectedItem}
        onClose={() => setUseModalVisible(false)}
        onUse={(qty, notes) => {
          setInventoryItems((prev) =>
            prev.map((it) =>
              it.id === selectedItem?.id
                ? { ...it, available: Math.max(0, it.available - qty) }
                : it,
            ),
          );
          setUseModalVisible(false);
          showDialog({ variant: "success", title: "Success", message: `Used ${qty} × ${selectedItem?.name}. Inventory updated.` });
        }}
        colors={colors}
      />
    </View>
  );
}

