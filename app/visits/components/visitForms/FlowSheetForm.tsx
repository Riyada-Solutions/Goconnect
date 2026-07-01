import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import { type SignatureValue } from "@/components/ui/SignatureField";
import { useApp } from "@/context/AppContext";
import type { Visit } from "@/data/models/visit";
import type {
  FlowSheet,
  FlowSheetCar,
  FlowSheetDialysate,
  FlowSheetDialysisParam,
  FlowSheetMobilePostTx as FlowSheetFormPostTx,
  FlowSheetMobileVitals as FlowSheetFormVitals,
  FlowSheetNursingAction,
  FlowSheetPainDetails,
} from "@/data/models/flowSheet";
import type { RuleAction } from "@/data/models/rules";
import type { FlowSheetDialysisMedication } from "@/data/models/flowSheet";
import {
  submitFlowSheetAlarmsTestForm,
  submitFlowSheetDialysisParams,
  submitFlowSheetFallRisk,
  submitFlowSheetMachines,
  submitFlowSheetNursingActions,
  submitFlowSheetOutsideDialysis,
  submitFlowSheetPain,
  submitFlowSheetPostTreatment,
  submitFlowSheetVitals,
} from "@/data/visit_repository";
import { OfflineQueuedError } from "@/data/offline_api";
import { Colors } from "@/theme/colors";

/** Convert the form-side SignatureValue to the API-side SavedSignature shape.
 *  `dataUrl` is optional — a read-only nurse confirmation has `signed: true`
 *  with no image, and the server still needs the attestation (signed_at /
 *  signed_by) round-tripped. */
const toSaved = (v: SignatureValue) =>
  v.signed
    ? {
        dataUrl: v.dataUrl ?? '',
        signedAt: v.signedAt ?? new Date().toISOString(),
        signatureUrl: v.signatureUrl,
      }
    : undefined;

import { Card } from "@/components/common/Card";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { Acc } from "../Acc";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { AccessForm } from "../forms/AccessForm";
import { AlarmsTestForm } from "../forms/AlarmsTestForm";
import { AnticoagForm } from "../forms/AnticoagForm";
import { CarForm } from "../forms/CarForm";
import { DialysateForm } from "../forms/DialysateForm";
import { DialysisMedsForm, type MedAdminMap } from "../forms/DialysisMedsForm";
import { DialysisParamsForm } from "../forms/DialysisParamsForm";
import { FallRiskForm } from "../forms/FallRiskForm";
import { IntakeOutputForm } from "../forms/IntakeOutputForm";
import { MachinesForm } from "../forms/MachinesForm";
import { NursingActionForm } from "../forms/NursingActionForm";
import { OutsideDialysisForm } from "../forms/OutsideDialysisForm";
import { PainForm } from "../forms/PainForm";
import { PostTreatmentForm } from "../forms/PostTreatmentForm";
import { VitalsForm } from "../forms/VitalsForm";

const EMPTY_VITALS: FlowSheetFormVitals = {
  height: "", preWeight: "", dryWeight: "", ufGoal: "",
  bpSystolic: "", bpDiastolic: "",
  temperature: "", spo2: "", hr: "", rr: "", rbs: "",
};
const EMPTY_PAIN: FlowSheetPainDetails = {
  toolUsed: "", location: "", frequency: "", radiatingTo: "",
  painType: "", occurs: "", ambulating: "", resting: "",
  eating: "", relievedBy: "", worsensBy: "",
};
const EMPTY_NURSING: FlowSheetNursingAction = { time: "", focus: "", action: "", evaluation: "", name: "" };
const EMPTY_DIALYSIS: FlowSheetDialysisParam = {
  time: "", systolic: "", diastolic: "", site: "", pulse: "", dialysateRate: "",
  uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "",
  access: "", alarms: "", initials: "",
};
const EMPTY_CAR: FlowSheetCar = { ffPercent: "", dialyzer: "", temp: "" };
const EMPTY_DIALYSATE: FlowSheetDialysate = { na: "", hco3: "", k: "", glucose: "" };
const EMPTY_POST: FlowSheetFormPostTx = {
  bpSystolic: "", bpDiastolic: "", bpSite: "", pulse: "", temp: "", tempMethod: "",
  spo2: "", rr: "", rbs: "", weight: "",
  txTimeHr: "", txTimeMin: "", txTimeL: "", dialysateL: "", uf: "", ufNet: "", blp: "",
  catheterLock: "", arterialAccess: "", venousAccess: "",
  needleSitesHeld: "", accessProblems: "", machineDisinfected: "",
  medicalComplaints: "", nonMedicalIncidence: "", initials: "",
};

const ALL_SECTIONS_OPEN: Record<string, boolean> = {
  outside: false, vitals: false, machines: false, pain: false, fall: false,
  nursing: false, dialysis: false, alarms: false, intake: false, car: false,
  access: false, dialysate: false, anticoag: false, meds: false, post: false,
};

export interface FlowSheetFormData {
  vitals: FlowSheetFormVitals;
  bpSite: string;
  method: string;
  machine: string;
  pain: string;
  painDetails: FlowSheetPainDetails;
  fallRisk: string;
  highFallRisk: boolean;
  outsideDialysis: boolean;
  alarmsTest: boolean;
  nursingActions: FlowSheetNursingAction[];
  dialysisParams: FlowSheetDialysisParam[];
  intake: string;
  output: string;
  car: FlowSheetCar;
  dialysate: FlowSheetDialysate;
  access: string;
  anticoagType: string;
  postAssessment: FlowSheetFormPostTx;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  /** ID of the visit this flow sheet belongs to â€” required for per-section saves. */
  visitId: number;
  /** Previously-saved Flow Sheet to pre-fill the form. */
  initial?: FlowSheet;
  medications: FlowSheetDialysisMedication[];
  medAdmin: MedAdminMap;
  medBusyIds?: Set<number>;
  onMedAction: (medId: number, action: "yes" | "no", reason?: string) => void;
  morseTotal: number;
  morseComplete: boolean;
  morseValues: { a: number | null; b: number | null; c: number | null; d: number | null; e: number | null; f: number | null };
  physicianCalled: "yes" | "no" | null;
  onOpenMorseSheet: () => void;
  onRequestPhysicianCall: () => void;
  onSignatureSaved?: (kind: "patient" | "nurse", value: SignatureValue) => void;
}

function SectionSaveBar({
  rule,
  label,
  save,
  onClear,
  visitId,
  canUpdate,
}: {
  rule: RuleAction;
  label: string;
  /** Caller-provided typed save call (e.g. `submitFlowSheetVitals(visitId, body)`).
   *  Each repo function returns the **full updated Visit** â€” we push it into
   *  the React Query cache so the visit-detail screen re-renders with the
   *  fresh data without needing a manual refetch. */
  save: () => Promise<Visit | unknown>;
  onClear: () => void;
  canUpdate?: boolean;
  visitId: number;
}) {
  const { can, t } = useApp();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const allowed = can(rule);
  const { dialogProps, show: showDialog } = useFeedbackDialog();
  const sectionName = label.replace(/^Save\s*/i, "");

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!allowed) {
      showDialog({ variant: "error", title: t("permissionDenied"), message: t("permissionDeniedDescription") });
      return;
    }
    setBusy(true);
    try {
      const result = (await save()) as Visit | undefined;
      // Push the updated visit into the cache so the parent screen reflects
      // the change immediately, and invalidate the list so list views refresh.
      if (result && (result as Visit).id != null) {
        qc.setQueryData(['visits', visitId], result);
      }
      qc.invalidateQueries({ queryKey: ['visits', visitId] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog({ variant: "success", title: "Saved", message: `${sectionName} saved successfully.` });
    } catch (err: any) {
      if (err instanceof OfflineQueuedError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showDialog({ variant: "success", title: "Saved Offline", message: "Your changes will sync automatically when you reconnect." });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showDialog({ variant: "error", title: "Save Failed", message: err?.message ?? "Failed to save. Please try again." });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClear();
  };

  const btnBase = {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  };
  const labelStyle = { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 };

  if (canUpdate === false) {
    return (
      <View />
    );
  }

  return (
    <>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <Pressable
          onPress={handleSave}
          disabled={busy || !allowed}
          style={{
            ...btnBase,
            backgroundColor: allowed ? Colors.primary : "#9CA3AF",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="save" size={14} color="#fff" />
          )}
          <Text style={labelStyle}>{label}</Text>
        </Pressable>

        <Pressable
          onPress={handleClear}
          disabled={busy}
          style={{
            ...btnBase,
            flex: 0,
            paddingHorizontal: 16,
            backgroundColor: "#EF4444",
            opacity: busy ? 0.5 : 1,
          }}
        >
          <Feather name="trash-2" size={14} color="#fff" />
          <Text style={labelStyle}>Clear</Text>
        </Pressable>
      </View>
      <FeedbackDialog {...dialogProps} />
    </>
  );
}

/** Light section-title bar used to separate the sub-sections that make up the
 *  single Alarms Test form (Intake/Output, CAR, Access, Dialysate, …). */
function FormSectionTitle({ title }: { title: string }) {
  return (
    <View
      style={{
        backgroundColor: "#DCE6F2",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginTop: 6,
      }}
    >
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#334155" }}>{title}</Text>
    </View>
  );
}

export function FlowSheetForm(props: Props) {
  const init = props.initial;
  const { user } = useApp();
  const currentUserId = Number(user?.id);
  const [open, setOpen] = useState(props.initialExpanded ?? false);
  const [sections, setSections] = useState<Record<string, boolean>>(
    props.initialExpanded ? ALL_SECTIONS_OPEN : {},
  );
  const toggle = useCallback((key: string) => setSections((p) => ({ ...p, [key]: !p[key] })), []);

  const [vitals, setVitals] = useState<FlowSheetFormVitals>(init?.vitals ?? EMPTY_VITALS);
  const [bpSite, setBpSite] = useState(init?.bpSite ?? "");
  const [method, setMethod] = useState(init?.method ?? "");
  const [machine, setMachine] = useState(init?.machine ?? "");
  const [pain, setPain] = useState(init?.pain ?? "");
  const [painDetails, setPainDetails] = useState<FlowSheetPainDetails>(init?.painDetails ?? EMPTY_PAIN);
  const [fallRisk, setFallRisk] = useState(init?.fallRisk ?? "");
  const [highFallRisk, setHighFallRisk] = useState(init?.highFallRisk ?? false);
  const [outsideDialysis, setOutsideDialysis] = useState(init?.outsideDialysis ?? false);
  const [alarmsTest, setAlarmsTest] = useState(init?.alarmsTest ?? false);
  const [nursingActions, setNursingActions] = useState<FlowSheetNursingAction[]>(
    init?.nursingActions && init.nursingActions.length > 0 ? init.nursingActions : [{ ...EMPTY_NURSING }],
  );
  const [dialysisParams, setDialysisParams] = useState<FlowSheetDialysisParam[]>(
    init?.dialysisParams && init.dialysisParams.length > 0 ? init.dialysisParams : [{ ...EMPTY_DIALYSIS }],
  );
  const [intake, setIntake] = useState(init?.intake ?? "");
  const [output, setOutput] = useState(init?.output ?? "");
  const [car, setCar] = useState<FlowSheetCar>(init?.car ?? EMPTY_CAR);
  const [dialysate, setDialysate] = useState<FlowSheetDialysate>(init?.dialysate ?? EMPTY_DIALYSATE);
  const [access, setAccess] = useState(init?.access ?? "");
  const [anticoag, setAnticoag] = useState({
    type: init?.anticoagType ?? "",
    bolusValue: init?.anticoagBolusValue ?? "",
    hourlyValue: init?.anticoagHourlyValue ?? "",
    dialyzerType: init?.dialyzerType ?? "",
    dialyzerSurfaceArea: init?.dialyzerSurfaceArea ?? "",
  });
  const initPostTx = (): FlowSheetFormPostTx => {
    const pa = init?.postAssessment
    if (!pa) return EMPTY_POST
    return {
      bpSystolic: pa.bpSystolic ?? '', bpDiastolic: pa.bpDiastolic ?? '',
      bpSite: pa.bpSite ?? '', pulse: pa.pulse ?? '', temp: pa.temp ?? '',
      tempMethod: pa.tempMethod ?? '', spo2: pa.spo2 ?? '', rr: pa.rr ?? '',
      rbs: pa.rbs ?? '', weight: pa.weight ?? '',
      txTimeHr: pa.txTimeHr ?? '', txTimeMin: pa.txTimeMin ?? '',
      txTimeL: pa.txTimeL ?? '', dialysateL: pa.dialysateL ?? '',
      uf: pa.uf ?? '', ufNet: pa.ufNet ?? '', blp: pa.blp ?? '',
      catheterLock: pa.catheterLock ?? '', arterialAccess: pa.arterialAccess ?? '',
      venousAccess: pa.venousAccess ?? '', needleSitesHeld: pa.needleSitesHeld ?? '',
      accessProblems: pa.accessProblems ?? '', machineDisinfected: pa.machineDisinfected ?? '',
      medicalComplaints: pa.medicalComplaints ?? '',
      nonMedicalIncidence: pa.nonMedicalIncidence ?? '', initials: pa.initials ?? '',
    }
  }
  const [postTx, setPostTx] = useState<FlowSheetFormPostTx>(initPostTx);
  // Note: response now returns `url` (CDN/S3 link), not inline base64. We feed
  // the URL into the local SignatureValue via the same `dataUrl` field â€” the
  // SignaturePad WebView can render an http(s) URL identically.
  const [patientSignature, setPatientSignature] = useState<SignatureValue>(
    init?.patientSignature
      ? { signed: true, dataUrl: init.patientSignature.url, signedAt: init.patientSignature.signedAt }
      : { signed: false },
  );
  const [nurseSignature, setNurseSignature] = useState<SignatureValue>(
    init?.nurseSignature
      ? { signed: true, dataUrl: init.nurseSignature.url, signedAt: init.nurseSignature.signedAt, signatureUrl: init.nurseSignature.url }
      : { signed: false },
  );

  // Sync signature state when the visit detail finishes loading after first
  // mount — `useState`'s lazy initializer only runs once, so without this
  // effect the nurse signature image would stay hidden when `init` arrives later.
  React.useEffect(() => {
    if (init?.patientSignature?.url) {
      setPatientSignature((prev) =>
        prev.signed && prev.dataUrl ? prev : {
          signed: true,
          dataUrl: init.patientSignature!.url,
          signedAt: init.patientSignature!.signedAt,
          signatureUrl: init.patientSignature!.url,
        },
      );
    }
    if (init?.nurseSignature?.url) {
      setNurseSignature((prev) =>
        prev.signed && prev.dataUrl ? prev : {
          signed: true,
          dataUrl: init.nurseSignature!.url,
          signedAt: init.nurseSignature!.signedAt,
          signatureUrl: init.nurseSignature!.url,
        },
      );
    }
  }, [init?.patientSignature?.url, init?.nurseSignature?.url]);

  // Seed the form fields once the visit detail finishes loading after first
  // mount. `useState`'s lazy initializer only runs on mount, and the form is
  // NOT always remounted when the data arrives — the parent's `key` stays
  // "new" until the flow sheet is formally submitted (`submittedAt` is null
  // for an in-progress visit). So without this, saved pre-treatment vitals,
  // `bpSite`, and every other section would stay blank even though the API
  // returned them. Guarded by a ref so it seeds only the first time `init`
  // becomes available — later refetches must not clobber the nurse's edits.
  const seededRef = React.useRef(!!init);
  React.useEffect(() => {
    if (seededRef.current || !init) return;
    seededRef.current = true;
    setVitals(init.vitals ?? EMPTY_VITALS);
    setBpSite(init.bpSite ?? "");
    setMethod(init.method ?? "");
    setMachine(init.machine ?? "");
    setPain(init.pain ?? "");
    setPainDetails(init.painDetails ?? EMPTY_PAIN);
    setFallRisk(init.fallRisk ?? "");
    setHighFallRisk(init.highFallRisk ?? false);
    setOutsideDialysis(init.outsideDialysis ?? false);
    setAlarmsTest(init.alarmsTest ?? false);
    if (init.nursingActions && init.nursingActions.length > 0) setNursingActions(init.nursingActions);
    if (init.dialysisParams && init.dialysisParams.length > 0) setDialysisParams(init.dialysisParams);
    setIntake(init.intake ?? "");
    setOutput(init.output ?? "");
    setCar(init.car ?? EMPTY_CAR);
    setDialysate(init.dialysate ?? EMPTY_DIALYSATE);
    setAccess(init.access ?? "");
    setAnticoag({
      type: init.anticoagType ?? "",
      bolusValue: init.anticoagBolusValue ?? "",
      hourlyValue: init.anticoagHourlyValue ?? "",
      dialyzerType: init.dialyzerType ?? "",
      dialyzerSurfaceArea: init.dialyzerSurfaceArea ?? "",
    });
    setPostTx(initPostTx());
  }, [init]);

  const updateVital = useCallback(
    (key: keyof FlowSheetFormVitals, v: string) => setVitals((p) => ({ ...p, [key]: v })),
    [],
  );

  const handleFallRiskChange = (v: string, highRisk: boolean) => {
    setFallRisk(v);
    if (highRisk) props.onRequestPhysicianCall();
  };

  const countFilled = (values: any[]) =>
    values.filter((v) => v !== "" && v !== undefined && v !== null).length;
  const countRowsFilled = (rows: Record<string, any>[]) =>
    rows.filter((r) => Object.values(r).some((v) => v !== "" && v !== undefined && v !== null)).length;

  // Outside Dialysis — single toggle
  const outsideFilled = outsideDialysis ? 1 : 0;
  const outsideTotal = 1;

  // Pre-Treatment Vitals — vitals object + bpSite + method
  const vitalsFields = [...Object.values(vitals), bpSite, method];
  const vitalsFilled = countFilled(vitalsFields);
  const vitalsTotal = vitalsFields.length;
  const vitalsDone = vitalsFilled > 0;

  // Machines — single field
  const machineFilled = machine !== "" ? 1 : 0;
  const machineTotal = 1;
  const machineDone = machineFilled > 0;

  // Pain Assessment — score + details
  const painFields = [pain, ...Object.values(painDetails)];
  const painFilled = countFilled(painFields);
  const painTotal = painFields.length;
  const painDone = painFilled > 0;

  // Fall Risk — single field
  const fallFilled = fallRisk !== "" ? 1 : 0;
  const fallTotal = 1;
  const fallDone = fallFilled > 0;

  // Nursing Actions — count rows with data
  const nursingFilled = countRowsFilled(nursingActions);
  const nursingTotal = Math.max(nursingActions.length, 1);
  const nursingDone = nursingFilled > 0;

  // Dialysis Parameters — count rows with data
  const dialysisFilled = countRowsFilled(dialysisParams);
  const dialysisTotal = Math.max(dialysisParams.length, 1);
  const dialysisDone = dialysisFilled > 0;

  // Alarms Test — single toggle
  const alarmsFilled = alarmsTest ? 1 : 0;
  const alarmsTotal = 1;

  // Intake / Output
  const intakeFields = [intake, output];
  const intakeFilled = countFilled(intakeFields);
  const intakeTotal = intakeFields.length;
  const intakeDone = intakeFilled > 0;

  // CAR
  const carFilled = countFilled(Object.values(car));
  const carTotal = Object.keys(car).length;
  const carDone = carFilled > 0;

  // Access
  const accessFilled = access !== "" ? 1 : 0;
  const accessTotal = 1;
  const accessDone = accessFilled > 0;

  // Dialysate
  const dialysateFilled = countFilled(Object.values(dialysate));
  const dialysateTotal = Object.keys(dialysate).length;
  const dialysateDone = dialysateFilled > 0;
  const anticoagFields = [
    anticoag.type,
    anticoag.bolusValue,
    anticoag.hourlyValue,
    anticoag.dialyzerType,
    anticoag.dialyzerSurfaceArea,
  ];
  const anticoagFilled = anticoagFields.filter((v) => v !== "").length;
  const anticoagTotal = anticoagFields.length;
  // Alarms Test — single combined form. The paper "Alarms Test" form bundles
  // the alarms toggle, intake/output, CAR, access, dialysate and anticoagulation
  // sub-sections, so we surface them under one accordion with a section title
  // per block. Anticoagulation is display-only (cannot be edited here), so it
  // is excluded from the combined Save below.
  const alarmsFormFilled =
    alarmsFilled + intakeFilled + carFilled + accessFilled + dialysateFilled + anticoagFilled;
  const alarmsFormTotal =
    alarmsTotal + intakeTotal + carTotal + accessTotal + dialysateTotal + anticoagTotal;
  const alarmsFormDone =
    alarmsTest || intakeDone || carDone || accessDone || dialysateDone;
  // Dialysis Medications — count medications the server already records as
  // administered (`administered.data.action` is 0/1) vs total prescribed.
  const medsFilled = props.medications.filter(
    (m) => m.administered?.data?.action != null,
  ).length;
  const medsTotal = props.medications.length;
  const medsDone = medsFilled > 0;

  // Post Treatment Assessment
  const postValues = Object.values(postTx);
  const postFilled = countFilled(postValues);
  const postTotal = postValues.length;
  const postDone = postFilled > 0;

  const { colors, isReadOnly, visitId } = props;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title="Flow Sheet"
        icon="file-text"
        iconColor="#22C55E"
        badges={isReadOnly ? [{ text: "Locked", bg: "#FEE2E2", fg: "#991B1B" }] : undefined}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors} 
      />
      <CollapsibleBody open={open} style={{ padding: 14 }}>
          <Acc title="Outside Dialysis" color="#0EA5E9" done={outsideDialysis} isOpen={!!sections.outside} onToggle={() => toggle("outside")} colors={colors} isReadOnly={isReadOnly} filled={outsideFilled} total={outsideTotal}>
            <OutsideDialysisForm value={outsideDialysis} onChange={setOutsideDialysis} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_outside_dialysis"
                label="Save Outside Dialysis"
                save={() => submitFlowSheetOutsideDialysis(visitId, { outsideDialysis })}
                onClear={() => setOutsideDialysis(false)}
              />
            )}
          </Acc>

          <Acc title="Pre-Treatment Vitals" color="#2DAAAE" done={vitalsDone} isOpen={!!sections.vitals} onToggle={() => toggle("vitals")} colors={colors} isReadOnly={isReadOnly} filled={vitalsFilled} total={vitalsTotal}>
            <VitalsForm vitals={vitals} bpSite={bpSite} method={method} onVitalChange={updateVital} onBpSiteChange={setBpSite} onMethodChange={setMethod} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_pre_treatment_vitals"
                label="Save Vitals"
                save={() => submitFlowSheetVitals(visitId, { vitals, bpSite, method })}
                onClear={() => { setVitals(EMPTY_VITALS); setBpSite(""); setMethod(""); }}
              />
            )}
          </Acc>

          <Acc title="Machines" color="#8B5CF6" done={machineDone} isOpen={!!sections.machines} onToggle={() => toggle("machines")} colors={colors} isReadOnly={isReadOnly} filled={machineFilled} total={machineTotal}>
            <MachinesForm machine={machine} onChange={setMachine} colors={colors} disabled={isReadOnly} />
            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_machines"
                label="Save Machines"
                save={() => submitFlowSheetMachines(visitId, { machine })}
                onClear={() => setMachine("")}
              />
            )}
          </Acc>

          <Acc title="Pain Assessment" color="#EF4444" done={painDone} isOpen={!!sections.pain} onToggle={() => toggle("pain")} colors={colors} isReadOnly={isReadOnly} filled={painFilled} total={painTotal}>
            <PainForm painScore={pain} painDetails={painDetails} onScoreChange={setPain} onDetailsChange={setPainDetails} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_pain_assessment"
                label="Save Pain Assessment"
                save={() => submitFlowSheetPain(visitId, { pain, painDetails })}
                onClear={() => { setPain(""); setPainDetails(EMPTY_PAIN); }}
              />
            )}
          </Acc>

          <Acc title="Fall Risk Assessment" color="#F59E0B" done={fallDone} isOpen={!!sections.fall} onToggle={() => toggle("fall")} colors={colors} isReadOnly={isReadOnly} filled={fallFilled} total={fallTotal}>
            <FallRiskForm
              fallRisk={fallRisk}
              highFallRisk={highFallRisk}
              morseComplete={props.morseComplete}
              morseTotal={props.morseTotal}
              morseValues={props.morseValues}
              physicianCalled={props.physicianCalled}
              onFallRiskChange={handleFallRiskChange}
              onHighFallRiskChange={setHighFallRisk}
              onOpenMorseSheet={props.onOpenMorseSheet}
              colors={colors}
            />
            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_fall_risk"
                label="Save Fall Risk"
                save={() => submitFlowSheetFallRisk(visitId, {
                  fallRisk,
                  highFallRisk,
                  morseValues: props.morseValues,
                  morseTotal: props.morseTotal,
                })}
                onClear={() => { setFallRisk(""); setHighFallRisk(false); }}
              />
            )}
          </Acc>

          <Acc title="Nursing Action" color="#10B981" done={nursingDone} isOpen={!!sections.nursing} onToggle={() => toggle("nursing")} colors={colors} isReadOnly={isReadOnly} filled={nursingFilled} total={nursingTotal}>
            <NursingActionForm rows={nursingActions} onChange={setNursingActions} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_nursing_actions"
                label="Save Nursing Action"
                save={() => submitFlowSheetNursingActions(visitId, { nursingActions, dialysisParams })}
                onClear={() => setNursingActions([{ ...EMPTY_NURSING }])}
              />
            )}
          </Acc>

          <Acc title="Dialysis Parameters" color="#3B82F6" done={dialysisDone} isOpen={!!sections.dialysis} onToggle={() => toggle("dialysis")} colors={colors} isReadOnly={isReadOnly} filled={dialysisFilled} total={dialysisTotal}>
            <DialysisParamsForm rows={dialysisParams} onChange={setDialysisParams} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_dialysis_parameters"
                label="Save Dialysis Parameters"
                save={() => submitFlowSheetDialysisParams(visitId, { dialysisParams, nursingActions })}
                onClear={() => setDialysisParams([{ ...EMPTY_DIALYSIS }])}
              />
            )}
          </Acc>

          {/* Single "Alarms Test" form. The paper form bundles the alarms
              toggle, intake/output, CAR, access, dialysate and anticoagulation
              into one sheet, so they live under one accordion with a title bar
              per sub-section. Anticoagulation is display-only here. */}
          <Acc title="Alarms Test" color="#F97316" done={alarmsFormDone} isOpen={!!sections.alarms} onToggle={() => toggle("alarms")} colors={colors} isReadOnly={isReadOnly} filled={alarmsFormFilled} total={alarmsFormTotal}>
            <AlarmsTestForm passed={alarmsTest} onChange={setAlarmsTest} colors={colors} />

            <FormSectionTitle title="INTAKE / OUTPUT" />
            <IntakeOutputForm intake={intake} output={output} onIntakeChange={setIntake} onOutputChange={setOutput} colors={colors} />

            <FormSectionTitle title="CAR" />
            <CarForm car={car} onChange={setCar} colors={colors} />

            <FormSectionTitle title="ACCESS / LOCATION" />
            <AccessForm value={access} onChange={setAccess} />

            <FormSectionTitle title="DIALYSATE" />
            <DialysateForm dialysate={dialysate} onChange={setDialysate} colors={colors} />

            <FormSectionTitle title="Anticoagulation" />
            <AnticoagForm value={anticoag} onChange={setAnticoag} colors={colors} disabled />

            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_alarms_test"
                label="Save Alarms Test"
                save={() =>
                  // Single request — all fields live under the backend
                  // `alarms_test` record. Anticoagulation is read-only, omitted.
                  submitFlowSheetAlarmsTestForm(visitId, {
                    alarmsTest,
                    intake,
                    output,
                    car,
                    access,
                    dialysate,
                  })
                }
                onClear={() => {
                  setAlarmsTest(false);
                  setIntake(""); setOutput("");
                  setCar(EMPTY_CAR);
                  setAccess("");
                  setDialysate(EMPTY_DIALYSATE);
                }}
              />
            )}
          </Acc>

          <Acc title="Dialysis Medications" color="#0891B2" done={medsDone} isOpen={!!sections.meds} onToggle={() => toggle("meds")} colors={colors} isReadOnly={isReadOnly} filled={medsFilled} total={medsTotal}>
            {/* Each row's Yes/No tap calls `POST /actions/patient-medications/{id}`
                directly via `onMedAction` — no section-level Save/Clear needed. */}
            <DialysisMedsForm medications={props.medications} medAdmin={props.medAdmin} busyIds={props.medBusyIds} onAction={props.onMedAction} colors={colors} />
          </Acc>

          <Acc title="Post Treatment Assessment" color="#6366F1" done={postDone} isOpen={!!sections.post} onToggle={() => toggle("post")} colors={colors} isReadOnly={isReadOnly} filled={postFilled} total={postTotal}>
            <PostTreatmentForm
              postTx={postTx}
              ufGoal={vitals.ufGoal}
              patientSignature={patientSignature}
              nurseSignature={nurseSignature}
              onChange={setPostTx}
              onPatientSignatureChange={setPatientSignature}
              onNurseSignatureChange={setNurseSignature}
              onSignatureSaved={props.onSignatureSaved}
              colors={colors}
            />
            {!isReadOnly && (
              <SectionSaveBar visitId={visitId} rule="submit_flow_sheet_post_treatment"
                label="Save Post Treatment"
                save={() => submitFlowSheetPostTreatment(visitId, {
                  postAssessment: postTx,
                  patientSignature: toSaved(patientSignature),
                  nurseSignature: toSaved(nurseSignature),
                  currentUserId: Number.isFinite(currentUserId) ? currentUserId : undefined,
                })}
                onClear={() => {
                  setPostTx(EMPTY_POST);
                  setPatientSignature({ signed: false });
                  setNurseSignature({ signed: false });
                }}
              />
            )}
          </Acc>
      </CollapsibleBody>
    </Card>
  );
}
