import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { FeedbackDialog, useFeedbackDialog } from "@/components/ui/FeedbackDialog";
import { type SignatureValue } from "@/components/ui/SignatureField";
import { useApp } from "@/context/AppContext";
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
import type { DialysisMedication } from "@/data/models/visit";
import {
  submitFlowSheetAccess,
  submitFlowSheetAlarmsTest,
  submitFlowSheetAnticoagulation,
  submitFlowSheetCar,
  submitFlowSheetDialysate,
  submitFlowSheetDialysisParams,
  submitFlowSheetFallRisk,
  submitFlowSheetIntakeOutput,
  submitFlowSheetMachines,
  submitFlowSheetMedications,
  submitFlowSheetNursingActions,
  submitFlowSheetOutsideDialysis,
  submitFlowSheetPain,
  submitFlowSheetPostTreatment,
  submitFlowSheetVitals,
} from "@/data/visit_repository";
import { Colors } from "@/theme/colors";

/** Convert the form-side SignatureValue to the API-side SavedSignature shape. */
const toSaved = (v: SignatureValue) =>
  v.signed && v.dataUrl
    ? { dataUrl: v.dataUrl, signedAt: v.signedAt ?? new Date().toISOString() }
    : undefined;

import { Card } from "@/components/common/Card";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { Acc } from "../Acc";
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
  postWeight: "",
  lastBp: "",
  lastPulse: "",
  condition: "",
  notes: "",
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
  postTx: FlowSheetFormPostTx;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  /** ID of the visit this flow sheet belongs to — required for per-section saves. */
  visitId: number;
  /** Previously-saved Flow Sheet to pre-fill the form. */
  initial?: FlowSheet;
  medications: DialysisMedication[];
  medAdmin: MedAdminMap;
  onMedAction: (medId: number, action: "yes" | "no") => void;
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
}: {
  rule: RuleAction;
  label: string;
  /** Caller-provided typed save call (e.g. `submitFlowSheetVitals(visitId, body)`).
   *  Resolves to whatever the underlying repo function returns (typically the
   *  updated `Visit`); we ignore the value here. */
  save: () => Promise<unknown>;
  onClear: () => void;
}) {
  const { can, t } = useApp();
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
      await save();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog({ variant: "success", title: "Saved", message: `${sectionName} saved successfully.` });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog({ variant: "error", title: "Save Failed", message: err?.message ?? "Failed to save. Please try again." });
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

export function FlowSheetForm(props: Props) {
  const init = props.initial;
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
  const [anticoagType, setAnticoagType] = useState(init?.anticoagType ?? "");
  const [postTx, setPostTx] = useState<FlowSheetFormPostTx>(init?.postTx ?? EMPTY_POST);
  // Note: response now returns `url` (CDN/S3 link), not inline base64. We feed
  // the URL into the local SignatureValue via the same `dataUrl` field — the
  // SignaturePad WebView can render an http(s) URL identically.
  const [patientSignature, setPatientSignature] = useState<SignatureValue>(
    init?.patientSignature
      ? { signed: true, dataUrl: init.patientSignature.url, signedAt: init.patientSignature.signedAt }
      : { signed: false },
  );
  const [nurseSignature, setNurseSignature] = useState<SignatureValue>(
    init?.nurseSignature
      ? { signed: true, dataUrl: init.nurseSignature.url, signedAt: init.nurseSignature.signedAt }
      : { signed: false },
  );

  const updateVital = useCallback(
    (key: keyof FlowSheetFormVitals, v: string) => setVitals((p) => ({ ...p, [key]: v })),
    [],
  );

  const handleFallRiskChange = (v: string, highRisk: boolean) => {
    setFallRisk(v);
    if (highRisk) props.onRequestPhysicianCall();
  };

  const vitalsDone = Object.values(vitals).some((v) => v !== "");
  const machineDone = machine !== "";
  const painDone = pain !== "" || Object.values(painDetails).some((v) => v !== "");
  const fallDone = fallRisk !== "";
  const nursingDone = nursingActions.some((r) => Object.values(r).some((v) => v !== ""));
  const dialysisDone = dialysisParams.some((r) => Object.values(r).some((v) => v !== ""));
  const intakeDone = intake !== "" || output !== "";
  const carDone = Object.values(car).some((v) => v !== "");
  const accessDone = access !== "";
  const dialysateDone = Object.values(dialysate).some((v) => v !== "");
  const anticoagDone = anticoagType !== "";
  const medsDone = Object.keys(props.medAdmin).length > 0;
  const postDone = Object.values(postTx).some((v) => v !== "");

  const { colors, isReadOnly, visitId } = props;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title="Flow Sheet"
        icon="file-text"
        iconColor="#22C55E"
        // badges={[{ text: "Easy Fill", bg: "#D1FAE5", fg: "#065F46" }]}
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors} 
      />
      {open && (
        <View style={{ padding: 14 }}>
          <Acc title="Outside Dialysis" color="#0EA5E9" done={outsideDialysis} isOpen={!!sections.outside} onToggle={() => toggle("outside")} colors={colors} isReadOnly={isReadOnly}>
            <OutsideDialysisForm value={outsideDialysis} onChange={setOutsideDialysis} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_outside_dialysis"
                label="Save Outside Dialysis"
                save={() => submitFlowSheetOutsideDialysis(visitId, { outsideDialysis })}
                onClear={() => setOutsideDialysis(false)}
              />
            )}
          </Acc>

          <Acc title="Pre-Treatment Vitals" color="#2DAAAE" done={vitalsDone} isOpen={!!sections.vitals} onToggle={() => toggle("vitals")} colors={colors} isReadOnly={isReadOnly}>
            <VitalsForm vitals={vitals} bpSite={bpSite} method={method} onVitalChange={updateVital} onBpSiteChange={setBpSite} onMethodChange={setMethod} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_pre_treatment_vitals"
                label="Save Vitals"
                save={() => submitFlowSheetVitals(visitId, { vitals, bpSite, method })}
                onClear={() => { setVitals(EMPTY_VITALS); setBpSite(""); setMethod(""); }}
              />
            )}
          </Acc>

          <Acc title="Machines" color="#8B5CF6" done={machineDone} isOpen={!!sections.machines} onToggle={() => toggle("machines")} colors={colors} isReadOnly={isReadOnly}>
            <MachinesForm machine={machine} onChange={setMachine} colors={colors} disabled={isReadOnly} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_machines"
                label="Save Machines"
                save={() => submitFlowSheetMachines(visitId, { machine })}
                onClear={() => setMachine("")}
              />
            )}
          </Acc>

          <Acc title="Pain Assessment" color="#EF4444" done={painDone} isOpen={!!sections.pain} onToggle={() => toggle("pain")} colors={colors} isReadOnly={isReadOnly}>
            <PainForm painScore={pain} painDetails={painDetails} onScoreChange={setPain} onDetailsChange={setPainDetails} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_pain_assessment"
                label="Save Pain Assessment"
                save={() => submitFlowSheetPain(visitId, { pain, painDetails })}
                onClear={() => { setPain(""); setPainDetails(EMPTY_PAIN); }}
              />
            )}
          </Acc>

          <Acc title="Fall Risk Assessment" color="#F59E0B" done={fallDone} isOpen={!!sections.fall} onToggle={() => toggle("fall")} colors={colors} isReadOnly={isReadOnly}>
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
              <SectionSaveBar
                rule="submit_flow_sheet_fall_risk"
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

          <Acc title="Nursing Action" color="#10B981" done={nursingDone} isOpen={!!sections.nursing} onToggle={() => toggle("nursing")} colors={colors} isReadOnly={isReadOnly}>
            <NursingActionForm rows={nursingActions} onChange={setNursingActions} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_nursing_actions"
                label="Save Nursing Action"
                save={() => submitFlowSheetNursingActions(visitId, { nursingActions })}
                onClear={() => setNursingActions([{ ...EMPTY_NURSING }])}
              />
            )}
          </Acc>

          <Acc title="Dialysis Parameters" color="#3B82F6" done={dialysisDone} isOpen={!!sections.dialysis} onToggle={() => toggle("dialysis")} colors={colors} isReadOnly={isReadOnly}>
            <DialysisParamsForm rows={dialysisParams} onChange={setDialysisParams} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_dialysis_parameters"
                label="Save Dialysis Parameters"
                save={() => submitFlowSheetDialysisParams(visitId, { dialysisParams })}
                onClear={() => setDialysisParams([{ ...EMPTY_DIALYSIS }])}
              />
            )}
          </Acc>

          <Acc title="Alarms Test" color="#F97316" done={alarmsTest} isOpen={!!sections.alarms} onToggle={() => toggle("alarms")} colors={colors} isReadOnly={isReadOnly}>
            <AlarmsTestForm passed={alarmsTest} onChange={setAlarmsTest} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_alarms_test"
                label="Save Alarms Test"
                save={() => submitFlowSheetAlarmsTest(visitId, { alarmsTest })}
                onClear={() => setAlarmsTest(false)}
              />
            )}
          </Acc>

          <Acc title="Intake / Output" color="#06B6D4" done={intakeDone} isOpen={!!sections.intake} onToggle={() => toggle("intake")} colors={colors} isReadOnly={isReadOnly}>
            <IntakeOutputForm intake={intake} output={output} onIntakeChange={setIntake} onOutputChange={setOutput} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_intake_output"
                label="Save Intake / Output"
                save={() => submitFlowSheetIntakeOutput(visitId, { intake, output })}
                onClear={() => { setIntake(""); setOutput(""); }}
              />
            )}
          </Acc>

          <Acc title="CAR" color="#8B5CF6" done={carDone} isOpen={!!sections.car} onToggle={() => toggle("car")} colors={colors} isReadOnly={isReadOnly}>
            <CarForm car={car} onChange={setCar} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_car"
                label="Save CAR"
                save={() => submitFlowSheetCar(visitId, { car })}
                onClear={() => setCar(EMPTY_CAR)}
              />
            )}
          </Acc>

          <Acc title="Access / Location" color="#10B981" done={accessDone} isOpen={!!sections.access} onToggle={() => toggle("access")} colors={colors} isReadOnly={isReadOnly}>
            <AccessForm value={access} onChange={setAccess} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_access"
                label="Save Access"
                save={() => submitFlowSheetAccess(visitId, { access })}
                onClear={() => setAccess("")}
              />
            )}
          </Acc>

          <Acc title="Dialysate" color="#3B82F6" done={dialysateDone} isOpen={!!sections.dialysate} onToggle={() => toggle("dialysate")} colors={colors} isReadOnly={isReadOnly}>
            <DialysateForm dialysate={dialysate} onChange={setDialysate} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_dialysate"
                label="Save Dialysate"
                save={() => submitFlowSheetDialysate(visitId, { dialysate })}
                onClear={() => setDialysate(EMPTY_DIALYSATE)}
              />
            )}
          </Acc>

          <Acc title="Anticoagulation" color="#EF4444" done={anticoagDone} isOpen={!!sections.anticoag} onToggle={() => toggle("anticoag")} colors={colors} isReadOnly={isReadOnly}>
            <AnticoagForm type={anticoagType} onChange={setAnticoagType} colors={colors} disabled={isReadOnly} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_anticoagulation"
                label="Save Anticoagulation"
                save={() => submitFlowSheetAnticoagulation(visitId, { anticoagType })}
                onClear={() => setAnticoagType("")}
              />
            )}
          </Acc>

          <Acc title="Dialysis Medications" color="#0891B2" done={medsDone} isOpen={!!sections.meds} onToggle={() => toggle("meds")} colors={colors} isReadOnly={isReadOnly}>
            <DialysisMedsForm medications={props.medications} medAdmin={props.medAdmin} onAction={props.onMedAction} colors={colors} />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_medications"
                label="Save Medications"
                save={() => submitFlowSheetMedications(visitId, { medAdmin: props.medAdmin })}
                onClear={() => {
                  // Medication state is controlled by parent; nothing local to clear.
                }}
              />
            )}
          </Acc>

          <Acc title="Post Treatment Assessment" color="#6366F1" done={postDone} isOpen={!!sections.post} onToggle={() => toggle("post")} colors={colors} isReadOnly={isReadOnly}>
            <PostTreatmentForm
              postTx={postTx}
              patientSignature={patientSignature}
              nurseSignature={nurseSignature}
              onChange={setPostTx}
              onPatientSignatureChange={setPatientSignature}
              onNurseSignatureChange={setNurseSignature}
              onSignatureSaved={props.onSignatureSaved}
              colors={colors}
            />
            {!isReadOnly && (
              <SectionSaveBar
                rule="submit_flow_sheet_post_treatment"
                label="Save Post Treatment"
                save={() => submitFlowSheetPostTreatment(visitId, {
                  postTx,
                  patientSignature: toSaved(patientSignature),
                  nurseSignature: toSaved(nurseSignature),
                })}
                onClear={() => {
                  setPostTx(EMPTY_POST);
                  setPatientSignature({ signed: false });
                  setNurseSignature({ signed: false });
                }}
              />
            )}
          </Acc>
        </View>
      )}
    </Card>
  );
}
