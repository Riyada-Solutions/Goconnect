import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { OfflineQueuedError } from "@/data/offline_api";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { CareTeamView } from "@/components/common/CareTeamView";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Colors } from "@/theme/colors";
import { useApp } from "@/context/AppContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useScreenPadding } from "@/hooks/useScreenPadding";
import { useSlot } from "@/hooks/useScheduler";
import { useCheckoutVisit, useCheckoutWithoutSapVisit, useCloseVisit, useEndVisit, useReopenVisit, useSaveProcedureTimes, useStartVisit, useSubmitAllergiesForm, useSubmitBloodSugarForm, useSubmitConsentForHemodialysis, useSubmitConsentForm, useSubmitDoctorProgressNote, useSubmitEnrollmentsChecklist, useSubmitIncidentsForm, useSubmitInventoryUsage, useSubmitMedicationAdministration, useSubmitMorseFallsRiskAssessment, useSubmitNursingProgressNote, useSubmitPatientAssessment, useSubmitPatientResponsibility, useSubmitReferral, useSubmitRefusal, useSubmitSariScreening, useSubmitSocialAssessmentForm, useSubmitSocialWorkerProgressNote, useSubmitVisualTriageChecklist, useVisit } from "@/hooks/useVisits";
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
import { ReferralForm, todayIso } from "./components/visitForms/ReferralForm";
import { RefusalForm } from "./components/visitForms/RefusalForm";
import { parseDisOfHemodialysis } from "@/data/transform/disOfHemodialysis";
import { SariScreeningForm } from "./components/visitForms/SariScreeningForm";
import { AllergiesForm } from "./components/visitForms/AllergiesForm";
import { BloodSugarForm } from "./components/visitForms/BloodSugarForm";
import { SocialAssessmentForm } from "./components/visitForms/SocialAssessmentForm";
import { IncidentsForm } from "./components/visitForms/IncidentsForm";
import { ConsentFormForm } from "./components/visitForms/ConsentFormForm";
import { PatientResponsibilityForm } from "./components/visitForms/PatientResponsibilityForm";
import { ConsentForHemodialysisForm } from "./components/visitForms/ConsentForHemodialysisForm";
import { EnrollmentsChecklistForm } from "./components/visitForms/EnrollmentsChecklistForm";
import { MedicationsForm } from "./components/visitForms/MedicationsForm";
import { DialysisOrderForm } from "./components/visitForms/DialysisOrderForm";
import { MARForm } from "./components/visitForms/MARForm";
import { PatientAssessmentForm } from "./components/visitForms/PatientAssessmentForm";
import { VisualTriageChecklistForm, type VisualTriageHistoryEntry } from "./components/visitForms/VisualTriageChecklistForm";
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

// Temporarily hidden per product request — flip back to true to restore.
const SHOW_SOCIAL_INCIDENTS_TRIAGE_FORMS = false;

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
  const { t, user, can, appSettings, refreshAppSettings } = useApp();
  const { colors } = useTheme();
  const { topPad, botPad } = useScreenPadding({ hasActionBar: true });
  const { dialogProps, show: showDialog } = useFeedbackDialog();

  const handleMutationError = useCallback((err: unknown) => {
    if (err instanceof OfflineQueuedError) {
      showDialog({ variant: "success", title: "Saved Offline", message: "Your changes will sync automatically when you reconnect." });
      return;
    }
    showDialog({ variant: "error", title: t("error"), message: err instanceof Error ? err.message : t("error") });
  }, [showDialog, t]);

  // Refresh app settings (including webview domain) when entering visit details
  useEffect(() => {
    void refreshAppSettings();
  }, [refreshAppSettings]);

  const isSlot = mode === "slot";
  const numId = Number(id);
  const slotQuery = useSlot(isSlot ? numId : 0);
  const visitQuery = useVisit(!isSlot ? numId : 0);
  const activeQuery = isSlot ? slotQuery : visitQuery;
  const record = activeQuery.data;

  // Refresh visit data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isSlot) {
        visitQuery.refetch();
      } else {
        slotQuery.refetch();
      }
    }, [isSlot, visitQuery, slotQuery])
  );

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

  // Pre-fill AllergiesForm from patient alerts when no visit form is saved yet.
  const allergiesInitial = useMemo(() => {
    const rec = record as any;
    // API returns saved allergies as a top-level object at rec["allergies"]
    const saved = rec?.["allergies"] ?? rec?.forms?.["allergies"]?.[0]?.value;
    if (saved) return saved;
    const allg: any[] = rec?.patient?.patientAlerts?.allergies ?? [];
    const contam: string[] = rec?.patient?.patientAlerts?.contamination ?? [];
    if (!allg.length && !contam.length) return null;
    return {
      drug_allergies:    allg.filter((a: any) => a.type === 'drug').map((a: any) => a.value).join(', '),
      food_allergies:    allg.filter((a: any) => a.type === 'food').map((a: any) => a.value).join(', '),
      general_allergies: allg.filter((a: any) => a.type === 'general').map((a: any) => a.value).join(', '),
      contamination:     contam.join(', '),
    };
  }, [(record as any)?.["allergies"], (record as any)?.patient?.patientAlerts]);

  // Class C forms (one row per visit, updated in place) — read the saved
  // value straight off the visit response, same lookup convention as the
  // other forms above (`rec[form]` or `rec.forms[form][0].value`).
  const consentFormInitial = useMemo(() => {
    const rec = record as any;
    return rec?.["consent-form"] ?? rec?.forms?.["consent-form"]?.[0]?.value ?? null;
  }, [(record as any)?.["consent-form"], (record as any)?.forms?.["consent-form"]?.[0]?.value]);

  const patientResponsibilityInitial = useMemo(() => {
    const rec = record as any;
    return rec?.["patient-responsibility"] ?? rec?.forms?.["patient-responsibility"]?.[0]?.value ?? null;
  }, [(record as any)?.["patient-responsibility"], (record as any)?.forms?.["patient-responsibility"]?.[0]?.value]);

  const consentForHemodialysisInitial = useMemo(() => {
    const rec = record as any;
    const raw = rec?.["consent-for-hemodialysis"] ?? rec?.forms?.["consent-for-hemodialysis"]?.[0]?.value;
    if (!raw) return null;
    return {
      en: {
        hospital: raw.hospital_en ?? "",
        doctorName: raw.doctor_name_en ?? "",
        patientAge: raw.patient_age_en ?? "",
        consentDate: raw.consent_date_en ?? "",
        personGivingConsent: raw.person_giving_consent_en ?? "",
        personConsentSignature: {
          signed: !!raw.person_consent_signature_signature_url,
          dataUrl: raw.person_consent_signature_signature_url ?? undefined,
          signedAt: raw.person_consent_signature_signed_at ?? undefined,
          signatureUrl: raw.person_consent_signature_signature_url ?? undefined,
        },
      },
      ar: {
        hospital: raw.hospital_ar ?? "",
        doctorName: raw.doctor_name_ar ?? "",
        patientAge: raw.patient_age_ar ?? "",
        consentDate: raw.consent_date_ar ?? "",
        personGivingConsent: raw.person_giving_consent_ar ?? "",
        personConsentSignature: {
          signed: !!raw.person_consent_signature_ar_signature_url,
          dataUrl: raw.person_consent_signature_ar_signature_url ?? undefined,
          signedAt: raw.person_consent_signature_ar_signed_at ?? undefined,
          signatureUrl: raw.person_consent_signature_ar_signature_url ?? undefined,
        },
      },
      witness_signature_signed_at: raw.witness_signature_signed_at ?? null,
      witness_signature_signed_by: raw.witness_signature_signed_by ?? null,
      witness_signature_ar_signed_at: raw.witness_signature_ar_signed_at ?? null,
      witness_signature_ar_signed_by: raw.witness_signature_ar_signed_by ?? null,
    };
  }, [(record as any)?.["consent-for-hemodialysis"], (record as any)?.forms?.["consent-for-hemodialysis"]?.[0]?.value]);

  const enrollmentsChecklistInitial = useMemo(() => {
    const rec = record as any;
    const raw = rec?.["enrollments-checklist"] ?? rec?.forms?.["enrollments-checklist"]?.[0]?.value;
    if (!raw) return null;
    return {
      appendixB: raw.appendixB ?? {},
      appendixC: raw.appendixC ?? {},
      demographics: raw.demographics ?? {},
      overAllFeedback: raw.overAllFeedback ?? {},
    };
  }, [(record as any)?.["enrollments-checklist"], (record as any)?.forms?.["enrollments-checklist"]?.[0]?.value]);

  const patientAssessmentInitial = useMemo(() => {
    const rec = record as any;
    const raw = rec?.["patient-assessment"] ?? rec?.forms?.["patient-assessment"]?.[0]?.value;
    if (!raw) return null;
    const {
      assessment, referral, social_hostory, patient_information, medical_surgical_history,
      surgical_history, assessment_signature_signed_at, assessment_signature_signed_by,
      ...flat
    } = raw;
    // mental_status (and the flat checkbox-array fields like cardio/eyes/etc.)
    // are arrays on the wire — the form renders them as checkbox groups, so
    // keep them as arrays rather than joining to a display string.
    const assessmentValue = assessment ?? {};
    // `contraptions_equipment_g1` / `_g2` are two independent single-select
    // radio groups nested under `medical_surgical_history` on the wire (e.g.
    // "IV", "Nebulizer") whose exact casing the backend expects verbatim —
    // confirmed via a live API capture. Legacy saved data may still be a
    // comma-joined string or an array, so collapse to a single value without
    // altering its case.
    const firstValue = (raw: unknown) =>
      Array.isArray(raw) ? raw[0] ?? "" : typeof raw === "string" ? raw.split(",")[0].trim() : raw ?? "";
    return {
      flat,
      assessment: assessmentValue,
      referral: referral ?? { social_worker: false, disaster_planning: false, allied_health_professionals: false },
      social_hostory: social_hostory ?? {},
      patient_information: patient_information ?? {},
      medical_surgical_history: {
        ...(medical_surgical_history ?? {}),
        contraptions_equipment_g1: firstValue(medical_surgical_history?.contraptions_equipment_g1),
        // The backend sends "" for `contraptions_equipment_g2` when "Others"
        // was selected — the actual value lives on `..._g2_others`. Restore
        // "Others" as the display value so the radio shows selected and the
        // specify field reveals, matching what was actually saved.
        contraptions_equipment_g2: (() => {
          const g2 = firstValue(medical_surgical_history?.contraptions_equipment_g2)
          return g2 === "" && medical_surgical_history?.contraptions_equipment_g2_others ? "Others" : g2
        })(),
      },
      surgical_history: surgical_history ?? [],
      assessment_signature_signed_at: assessment_signature_signed_at ?? null,
      assessment_signature_signed_by: assessment_signature_signed_by ?? null,
    };
  }, [(record as any)?.["patient-assessment"], (record as any)?.forms?.["patient-assessment"]?.[0]?.value]);

  // Pre-fill IncidentsForm from patient + visit data when no saved form exists.
  const incidentsInitial = useMemo(() => {
    const rec = record as any;
    // API returns incidents as a top-level array at rec["incidents"]
    const saved = rec?.["incidents"]?.[0] ?? rec?.forms?.["incidents"]?.[0]?.value;
    if (saved) return saved;
    if (!rec?.patient) return null;
    return {
      patient_name:          rec.patient.name ?? '',
      patient_mrn:           rec.patient.mrn ?? '',
      patient_dob:           rec.patient.dob ?? '',
      dialysis_session_time: rec.date ?? '',
    };
  }, [(record as any)?.["incidents"]?.[0], (record as any)?.patient?.id]);

  // Pre-fill VisualTriageChecklistForm from patient + visit data when no saved form exists.
  const visualTriageInitial = useMemo(() => {
    const rec = record as any;
    // API returns visual triage as a top-level array; use the last (most recent) entry
    const arr = rec?.["visual-triage-checklist"];
    const saved = (Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : null)
      ?? rec?.forms?.["visual-triage-checklist"]?.[0]?.value;
    if (saved) return saved;
    if (!rec?.patient) return null;
    return {
      patient_name: rec.patient.name ?? '',
      mrn:          rec.patient.mrn ?? '',
      hospital:     rec.patient.hospital ?? '',
      date:         rec.date ?? '',
    };
  }, [(record as any)?.["visual-triage-checklist"]?.length, (record as any)?.patient?.id]);

  const visualTriageHistory = useMemo((): VisualTriageHistoryEntry[] => {
    const arr = (record as any)?.["visual-triage-checklist"];
    if (!Array.isArray(arr) || arr.length === 0) return [];
    return [...arr].reverse().map((entry: any) => ({
      ...entry,
      id: entry.id,
      createdAt: entry.created_at ?? entry.createdAt,
      authorName: entry.author?.name ?? entry.authorName,
    }));
  }, [(record as any)?.["visual-triage-checklist"]?.length]);

  const isLoading = activeQuery.isLoading || activeQuery.isFetching;
  const isError = activeQuery.isError;
  const errorMessage = activeQuery.error instanceof Error ? activeQuery.error.message : "Something went wrong.";
  const refetch = () => activeQuery.refetch();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  type VisitPhase = "in_progress" | "start_procedure" | "end_procedure" | "completed" | "reopened";
  const recordStatus = record?.status as string | undefined;
  const initialPhase: VisitPhase =
    recordStatus === "completed" || recordStatus === "close" || recordStatus === "closed"
      ? "completed"
      : recordStatus === "reopened"
        ? "reopened"
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

  // reopened is editable (nurse can update forms); completed is read-only
  const isReadOnly = visitPhase === "completed";

  // Sync the local phase forward to the server status once the visit loads
  // (the query resolves async, so a visit already in `start_procedure` would
  // otherwise stay stuck at the initial `in_progress`). Forward-only so an
  // optimistic local advance isn't reverted before its mutation round-trips.
  // reopened (4) ranks above completed (3) so it overrides a stale completed phase.
  const PHASE_RANK: Record<VisitPhase, number> = {
    in_progress: 0, start_procedure: 1, end_procedure: 2, completed: 3, reopened: 4,
  };
  useEffect(() => {
    setVisitPhase((prev) => (PHASE_RANK[initialPhase] > PHASE_RANK[prev] ? initialPhase : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhase]);

  // The Flow Sheet records the dialysis treatment itself, so it locks as soon
  // as the nurse ends the procedure — earlier than the rest of the screen,
  // which stays editable until checkout (`completed`). A reopened visit is
  // editable again, same as the rest of the screen.
  const isFlowSheetLocked =
    visitPhase !== "reopened" && PHASE_RANK[visitPhase] >= PHASE_RANK.end_procedure;

  const { visitElapsed, procedureElapsed } = useVisitTimers(visitPhase, {
    visitStart: (record as any)?.startTime,
    visitEnd: (record as any)?.endTime,
    procedureStart: (record as any)?.startProcedureTime,
    procedureEnd: (record as any)?.endProcedureTime,
  });

  const startVisitMutation = useStartVisit(numId);
  const endVisitMutation = useEndVisit(numId);
  const checkoutVisitMutation = useCheckoutVisit(numId);
  const checkoutWithoutSapMutation = useCheckoutWithoutSapVisit(numId);
  const closeVisitMutation = useCloseVisit(numId);
  const reopenVisitMutation = useReopenVisit(numId);
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
    setShowProcedureEdit(true);
    setProcedureEndTimeStr(DateTimeConverter.time(new Date()));
    setEditProcEnd(DateTimeConverter.time(new Date()));
    endVisitMutation.mutate();
  }, [endVisitMutation, record, showDialog, t]);

  const handleCheckOut = useCallback(() => {
    setShowCheckoutModal(false);
    setVisitPhase("completed");
    checkoutVisitMutation.mutate(undefined, {
      onError: (err) => {
        setVisitPhase("end_procedure");
        handleMutationError(err);
      },
    });
  }, [checkoutVisitMutation, showDialog, t]);

  const handleCheckOutWithoutSap = useCallback(() => {
    setShowCheckoutModal(false);
    setVisitPhase("completed");
    checkoutWithoutSapMutation.mutate(undefined, {
      onError: (err) => {
        setVisitPhase("end_procedure");
        handleMutationError(err);
      },
    });
  }, [checkoutWithoutSapMutation, showDialog, t]);

  const handleCloseVisit = useCallback(() => {
    setVisitPhase("completed");
    closeVisitMutation.mutate(undefined, {
      onError: (err) => {
        setVisitPhase("reopened");
        handleMutationError(err);
      },
    });
  }, [closeVisitMutation, handleMutationError]);

  const handleReopenVisit = useCallback(() => {
    setVisitPhase("reopened");
    reopenVisitMutation.mutate(undefined, {
      onError: (err) => {
        setVisitPhase("completed");
        handleMutationError(err);
      },
    });
  }, [reopenVisitMutation, handleMutationError]);

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
        onError: handleMutationError,
      },
    );
  }, [submitMedAdministration, showDialog, t]);

  // Inventory modal — medications ride on Visit; inventory itself is now
  // fetched by PatientInventorySection from the paginated /patient-inventory
  // endpoint (patient/visit id only, no local copy needed).
  const [useModalVisible, setUseModalVisible] = useState(false);
  const medications = (record as any)?.flowSheet?.dialysisMedications ?? [];
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

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
  const submitAllergies = useSubmitAllergiesForm(numId);
  const submitBloodSugar = useSubmitBloodSugarForm(numId);
  const submitSocialAssessment = useSubmitSocialAssessmentForm(numId);
  const submitIncidents = useSubmitIncidentsForm(numId);
  const submitVisualTriage = useSubmitVisualTriageChecklist(numId);
  const submitConsentForm = useSubmitConsentForm(numId);
  const submitPatientResponsibility = useSubmitPatientResponsibility(numId);
  const submitConsentForHemodialysis = useSubmitConsentForHemodialysis(numId);
  const submitEnrollmentsChecklist = useSubmitEnrollmentsChecklist(numId);
  const submitPatientAssessment = useSubmitPatientAssessment(numId);
  // preTreatmentVitals now lives inside flowSheet (single source of truth).
  const preTreatmentVitals = (record as any)?.flowSheet?.preTreatmentVitals;

  // Patient + alerts ride on the visit response (single source of truth).
  // The backend nests alerts inside `patient.patientAlerts`; keep the
  // top-level fallback for older payloads.
  const patientRecord = (record as any)?.patient ?? null;
  const patientAlertsData =
    patientRecord?.patientAlerts ?? (record as any)?.patientAlerts ?? null;


  // App-bar always visible — body switches between skeleton/error/empty/content.
  if ((isLoading && !record) || refreshing) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <VisitDetailTopBar topPad={topPad} colors={colors} onRefresh={refetch} isRefreshing={refreshing} />
        <VisitDetailSkeleton colors={colors} />
      </View>
    );
  }
  if (isError && !record) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <VisitDetailTopBar topPad={topPad} colors={colors} onRefresh={refetch} isRefreshing={refreshing} />
        <VisitDetailError colors={colors} message={errorMessage} onRetry={refetch} />
      </View>
    );
  }
  if (!record) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <VisitDetailTopBar topPad={topPad} colors={colors} onRefresh={refetch} isRefreshing={refreshing} />
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
  // Visit start and end times for duration calculation
  const visitStartTimeStr = (record as any).startTime ? DateTimeConverter.time((record as any).startTime) : undefined;
  const visitEndTimeStr = (record as any).endTime ? DateTimeConverter.time((record as any).endTime) : undefined;
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

  // Primary physician / social worker now come straight off the patient
  // record (no more careTeam role lookup).
  const primaryPhysician = patientRecord?.primaryPhysician ?? "";
  const primarySocialWorker = patientRecord?.primarySocialWorker ?? "";

  // Demographics shown read-only on the Enrollments Checklist — sourced live
  // from the patient/referral record, not user-editable.
  const enrollmentDemographicsFromVisit = patientRecord
    ? (() => {
        const latestReferral = (record as any)?.referrals?.[0];
        return {
          patient_mrn: patientRecord.mrn ?? "",
          patient_name: patientRecord.name ?? "",
          referred_hospital: latestReferral?.referralHospitalName ?? hospital ?? "",
          primary_physician_name: primaryPhysician,
          primary_social_worker_name: primarySocialWorker,
          // Matches ReferralForm's own default: today's date when no referral exists yet.
          referral_date: latestReferral?.referralDate || patientRecord.referralDate || todayIso(),
          home_acceptance_date: patientRecord.homeAcceptanceDate ?? "",
          medical_acceptance_date: patientRecord.medicalAcceptanceDate ?? "",
          first_hhd_treatment_date: patientRecord.firstHHDTreatmentDate ?? "",
          nurse_manager_time: patientRecord.nurseManagerTime ?? "",
        };
      })()
    : null;

  const alertCount =
    (alerts?.allergies?.length ?? 0) +
    (alerts?.contamination?.length ?? 0) +
    (alerts?.instructions ? 1 : 0) +
    (alerts?.isolation ? 1 : 0);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <FeedbackDialog {...dialogProps} />
      <VisitDetailTopBar topPad={topPad} colors={colors} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? topPad : 0}
      >
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          visitStartTimeStr={visitStartTimeStr}
          visitEndTimeStr={visitEndTimeStr}
          procedureTime={procedureTime}
          patientName={patientName}
          hospital={hospital}
          insurance={insurance}
          provider={provider}
          doctorTime={doctorTime}
          visitPhase={visitPhase}
          rawStatus={recordStatus}
          visitElapsed={visitElapsed}
          procedureElapsed={procedureElapsed}
          procedureStartTimeStr={procedureStartTimeStr}
          procedureEndTimeStr={procedureEndTimeStr}
          showProcedureEdit={showProcedureEdit}
          enableProcedureEdit={appSettings.enableToggleProcedureButton}
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

        {/* ─── Medications (webview) ──────────────────────────────────────── */}
        {/* <Animated.View entering={FadeInDown.delay(218).springify()} style={s.section}>
          <MedicationsForm visitId={numId} colors={colors} />
        </Animated.View> */}

        {/* ─── Dialysis Order (webview) ───────────────────────────────────── */}
        {/* <Animated.View entering={FadeInDown.delay(220).springify()} style={s.section}>
          <DialysisOrderForm visitId={numId} colors={colors} />
        </Animated.View> */}

        {/* ─── MAR (webview) ──────────────────────────────────────────────── */}
        {/* <Animated.View entering={FadeInDown.delay(221).springify()} style={s.section}>
          <MARForm visitId={numId} colors={colors} />
        </Animated.View> */}

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
                onError: handleMutationError,
              });
            }}
            nursingNotes={nursingProgressNotes}
            onSaveNursing={(note) => {
              submitNursingProgressNote.mutate(note, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("nursingProgressNote") }),
                onError: handleMutationError,
              });
            }}
            socialWorkerNotes={socialWorkerProgressNotes}
            onSaveSocialWorker={(input) => {
              submitSocialWorkerProgressNote.mutate(input, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("socialWorkerProgressNote") }),
                onError: handleMutationError,
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
            primarySocialWorker={primarySocialWorker}
            referralBy={user?.name ?? ""}
            previousReferrals={(record as any)?.referrals ?? []}
            isSaving={submitReferral.isPending}
            onSave={(data) => {
              submitReferral.mutate(data, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("referral") }),
                onError: handleMutationError,
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
                onError: handleMutationError,
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
            defaultPatientName={patientName}
            initial={(record as any)?.sariScreenings?.[0] ?? null}
            key={(record as any)?.sariScreenings?.[0]?.createdAt ?? "sari-new"}
            isSaving={submitSariScreening.isPending}
            onSave={(data) => {
              submitSariScreening.mutate(data, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("sariScreeningTool") }),
                onError: handleMutationError,
              });
            }}
            t={t}
          />
        </Animated.View>

        {/* ─── Allergies ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(241).springify()} style={s.section}>
          <AllergiesForm
            colors={colors}
            isReadOnly={isReadOnly}
            initialExpanded={false}
            initial={allergiesInitial}
            isSaving={submitAllergies.isPending}
            onSave={(data) => {
              submitAllergies.mutate(data, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("allergiesForm") }),
                onError: handleMutationError,
              });
            }}
            t={t}
          />
        </Animated.View>

        {/* ─── Blood Sugar Monitor ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(244).springify()} style={s.section}>
          <BloodSugarForm
            colors={colors}
            isReadOnly={isReadOnly}
            initialExpanded={false}
            initial={(record as any)?.["blood-sugar"]?.[0] ?? (record as any)?.forms?.["blood-sugar"]?.[0]?.value ?? null}
            isSaving={submitBloodSugar.isPending}
            onSave={(data) => {
              submitBloodSugar.mutate(data, {
                onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("bloodSugarForm") }),
                onError: handleMutationError,
              });
            }}
            t={t}
          />
        </Animated.View>

        {/* ─── Consent Form ────────────────────────────────────────────── */}
        {can("view_consent_form") && (
          <Animated.View entering={FadeInDown.delay(256).springify()} style={s.section}>
            <ConsentFormForm
              colors={colors}
              isReadOnly={isReadOnly || !can("submit_consent_form")}
              initialExpanded={false}
              initial={consentFormInitial}
              isSaving={submitConsentForm.isPending}
              currentUserId={user?.employeeId ?? ""}
              currentUserName={user?.name}
              patientName={patientName}
              patientId={patientRecord?.id}
              onSave={(data) => {
                submitConsentForm.mutate(data, {
                  onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("consentFormTitle") }),
                  onError: handleMutationError,
                });
              }}
              t={t}
            />
          </Animated.View>
        )}

        {/* ─── Patient Responsibility ──────────────────────────────────── */}
        {can("view_patient_responsibility") && (
          <Animated.View entering={FadeInDown.delay(259).springify()} style={s.section}>
            <PatientResponsibilityForm
              colors={colors}
              isReadOnly={isReadOnly || !can("submit_patient_responsibility")}
              initialExpanded={false}
              initial={patientResponsibilityInitial}
              isSaving={submitPatientResponsibility.isPending}
              currentUserId={user?.employeeId ?? ""}
              currentUserName={user?.name}
              onSave={(data) => {
                submitPatientResponsibility.mutate(data, {
                  onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("patientResponsibilityTitle") }),
                  onError: handleMutationError,
                });
              }}
              t={t}
            />
          </Animated.View>
        )}

        {/* ─── Consent for Hemodialysis ────────────────────────────────── */}
        {can("view_consent_for_hemodialysis") && (
          <Animated.View entering={FadeInDown.delay(262).springify()} style={s.section}>
            <ConsentForHemodialysisForm
              colors={colors}
              isReadOnly={isReadOnly || !can("submit_consent_for_hemodialysis")}
              initialExpanded={false}
              initial={consentForHemodialysisInitial}
              isSaving={submitConsentForHemodialysis.isPending}
              currentUserId={user?.employeeId ?? ""}
              currentUserName={user?.name}
              onSave={(data) => {
                submitConsentForHemodialysis.mutate(data, {
                  onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("consentForHemodialysisTitle") }),
                  onError: handleMutationError,
                });
              }}
              t={t}
            />
          </Animated.View>
        )}

        {/* ─── Patient Assessment ──────────────────────────────────────── */}
        {can("view_patient_assessment") && (
          <Animated.View entering={FadeInDown.delay(265).springify()} style={s.section}>
            <PatientAssessmentForm
              colors={colors}
              isReadOnly={isReadOnly || !can("submit_patient_assessment")}
              initialExpanded={false}
              initial={patientAssessmentInitial}
              isSaving={submitPatientAssessment.isPending}
              currentUserId={user?.employeeId ?? ""}
              currentUserName={user?.name}
              flowSheetBp={{
                systolic: (record as any)?.flowSheet?.postAssessment?.bpSystolic,
                diastolic: (record as any)?.flowSheet?.postAssessment?.bpDiastolic,
              }}
              onSave={(data) => {
                submitPatientAssessment.mutate(data, {
                  onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("patientAssessmentTitle") }),
                  onError: handleMutationError,
                });
              }}
              t={t}
            />
          </Animated.View>
        )}

        {/* ─── Enrollments Checklist ───────────────────────────────────── */}
        {can("view_enrollments_checklist") && (
          <Animated.View entering={FadeInDown.delay(268).springify()} style={s.section}>
            <EnrollmentsChecklistForm
              colors={colors}
              isReadOnly={isReadOnly || !can("submit_enrollments_checklist")}
              initialExpanded={false}
              initial={enrollmentsChecklistInitial}
              demographicsFromVisit={enrollmentDemographicsFromVisit}
              isSaving={submitEnrollmentsChecklist.isPending}
              currentUserId={user?.employeeId ?? ""}
              currentUserName={user?.name}
              onSave={(data) => {
                submitEnrollmentsChecklist.mutate(data, {
                  onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("enrollmentsChecklistTitle") }),
                  onError: handleMutationError,
                });
              }}
              t={t}
            />
          </Animated.View>
        )}

        {SHOW_SOCIAL_INCIDENTS_TRIAGE_FORMS && (
          <>
            {/* ─── Social Assessment ───────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(247).springify()} style={s.section}>
              <SocialAssessmentForm
                colors={colors}
                isReadOnly={isReadOnly}
                initialExpanded={false}
                initial={(record as any)?.["social-assessment"] ?? (record as any)?.forms?.["social-assessment"]?.[0]?.value ?? null}
                isSaving={submitSocialAssessment.isPending}
                onSave={(data) => {
                  submitSocialAssessment.mutate(data, {
                    onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("socialAssessmentForm") }),
                    onError: handleMutationError,
                  });
                }}
                t={t}
              />
            </Animated.View>

            {/* ─── Incidents ───────────────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(250).springify()} style={s.section}>
              <IncidentsForm
                colors={colors}
                isReadOnly={isReadOnly}
                initialExpanded={false}
                initial={incidentsInitial}
                isSaving={submitIncidents.isPending}
                onSave={(data) => {
                  submitIncidents.mutate(data, {
                    onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("incidentsForm") }),
                    onError: handleMutationError,
                  });
                }}
                t={t}
              />
            </Animated.View>

            {/* ─── Visual Triage Checklist ─────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(253).springify()} style={s.section}>
              <VisualTriageChecklistForm
                colors={colors}
                isReadOnly={isReadOnly}
                initialExpanded={false}
                initial={visualTriageInitial}
                history={visualTriageHistory}
                isSaving={submitVisualTriage.isPending}
                onSave={(data) => {
                  submitVisualTriage.mutate(data, {
                    onSuccess: () => showDialog({ variant: "success", title: t("save"), message: t("visualTriageChecklist") }),
                    onError: handleMutationError,
                  });
                }}
                t={t}
              />
            </Animated.View>
          </>
        )}

        <PatientInventorySection
          patientId={Number(patientRecord?.id) || 0}
          visitId={numId}
          expanded={inventoryOpen}
          onToggle={() => setInventoryOpen(!inventoryOpen)}
          onSelectItem={(item) => { setSelectedItem(item); setUseModalVisible(true); }}
          isReadOnly={isReadOnly}
          colors={colors}
        />
        {/* {patientName && ( */}
          <WorkflowActionButtons
            phase={visitPhase}
            canReopen={can("visits.ReopenMyVisit") || can("visits.ReopenAllVisit")}
            onStartProcedure={handleStartProcedure}
            onEndProcedure={handleEndProcedure}
            onCheckOut={() => setShowCheckoutModal(true)}
            onCheckOutWithoutSap={handleCheckOutWithoutSap}
            onClose={handleCloseVisit}
            onReopen={handleReopenVisit}
            startProcedureLoading={startVisitMutation.isPending}
            endProcedureLoading={endVisitMutation.isPending}
            checkOutLoading={checkoutVisitMutation.isPending}
            checkOutWithoutSapLoading={checkoutWithoutSapMutation.isPending}
            closeLoading={closeVisitMutation.isPending}
            reopenLoading={reopenVisitMutation.isPending}
          />
        {/* )} */}
      </ScrollView>
      </KeyboardAvoidingView>

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
        loading={checkoutVisitMutation.isPending}
      />
      {/* Use Items Modal */}
      <UseItemsModal
        visible={useModalVisible}
        item={selectedItem}
        onClose={() => setUseModalVisible(false)}
        onUse={(qty, notes) => {
          if (!selectedItem) return;
          setUseModalVisible(false);
          submitInventoryUsageMutation.mutate(
            {
              patientId:           patientRecord?.id ?? 0,
              patientInventoryId:  selectedItem.id,
              quantity:            qty,
              notes:               notes || null,
            },
            {
              onSuccess: () =>
                showDialog({ variant: "success", title: "Success", message: `Used ${qty} × ${selectedItem.name}. Inventory updated.` }),
              onError: handleMutationError,
            },
          );
        }}
        colors={colors}
      />
    </View>
  );
}

