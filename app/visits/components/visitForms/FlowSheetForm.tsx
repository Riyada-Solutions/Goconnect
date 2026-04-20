import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";
import type {
  FlowSheetCar,
  FlowSheetDialysate,
  FlowSheetDialysisParam,
  FlowSheetMobilePostTx as FlowSheetFormPostTx,
  FlowSheetMobileVitals as FlowSheetFormVitals,
  FlowSheetNursingAction,
  FlowSheetPainDetails,
} from "@/types/flowSheet";
import type { DialysisMedication } from "@/types/visit";

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
const EMPTY_POST: FlowSheetFormPostTx = { postWeight: "", lastBp: "", lastPulse: "", condition: "", notes: "" };

const ALL_SECTIONS_OPEN: Record<string, boolean> = {
  outside: true, vitals: true, machines: true, pain: true, fall: true,
  nursing: true, dialysis: true, alarms: true, intake: true, car: true,
  access: true, dialysate: true, anticoag: true, meds: true, post: true,
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
  medications: DialysisMedication[];
  medAdmin: MedAdminMap;
  onMedAction: (medId: number, action: "yes" | "no") => void;
  morseTotal: number;
  morseComplete: boolean;
  morseValues: { a: number | null; b: number | null; c: number | null; d: number | null; e: number | null; f: number | null };
  physicianCalled: "yes" | "no" | null;
  patientSigned: boolean;
  nurseSigned: boolean;
  onOpenMorseSheet: () => void;
  onOpenPatientSignature: () => void;
  onOpenNurseSignature: () => void;
  onRequestPhysicianCall: () => void;
  onSave: (data: FlowSheetFormData) => void;
}

export function FlowSheetForm(props: Props) {
  const [open, setOpen] = useState(props.initialExpanded ?? false);
  const [sections, setSections] = useState<Record<string, boolean>>(
    props.initialExpanded ? ALL_SECTIONS_OPEN : {},
  );
  const toggle = useCallback((key: string) => setSections((p) => ({ ...p, [key]: !p[key] })), []);

  const [vitals, setVitals] = useState<FlowSheetFormVitals>(EMPTY_VITALS);
  const [bpSite, setBpSite] = useState("");
  const [method, setMethod] = useState("");
  const [machine, setMachine] = useState("");
  const [pain, setPain] = useState("");
  const [painDetails, setPainDetails] = useState<FlowSheetPainDetails>(EMPTY_PAIN);
  const [fallRisk, setFallRisk] = useState("");
  const [highFallRisk, setHighFallRisk] = useState(false);
  const [outsideDialysis, setOutsideDialysis] = useState(false);
  const [alarmsTest, setAlarmsTest] = useState(false);
  const [nursingActions, setNursingActions] = useState<FlowSheetNursingAction[]>([{ ...EMPTY_NURSING }]);
  const [dialysisParams, setDialysisParams] = useState<FlowSheetDialysisParam[]>([{ ...EMPTY_DIALYSIS }]);
  const [intake, setIntake] = useState("");
  const [output, setOutput] = useState("");
  const [car, setCar] = useState<FlowSheetCar>(EMPTY_CAR);
  const [dialysate, setDialysate] = useState<FlowSheetDialysate>(EMPTY_DIALYSATE);
  const [access, setAccess] = useState("");
  const [anticoagType, setAnticoagType] = useState("");
  const [postTx, setPostTx] = useState<FlowSheetFormPostTx>(EMPTY_POST);

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

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVitals(EMPTY_VITALS);
    setPain(""); setFallRisk(""); setIntake(""); setOutput(""); setAccess("");
    setOutsideDialysis(false); setAlarmsTest(false); setHighFallRisk(false);
    setBpSite(""); setMethod(""); setMachine("");
    setNursingActions([{ ...EMPTY_NURSING }]);
    setDialysisParams([{ ...EMPTY_DIALYSIS }]);
    setCar(EMPTY_CAR);
    setDialysate(EMPTY_DIALYSATE);
    setAnticoagType("");
    setPostTx(EMPTY_POST);
    setPainDetails(EMPTY_PAIN);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    props.onSave({
      vitals, bpSite, method, machine, pain, painDetails, fallRisk, highFallRisk,
      outsideDialysis, alarmsTest, nursingActions, dialysisParams,
      intake, output, car, dialysate, access, anticoagType, postTx,
    });
  };

  const { colors, isReadOnly } = props;

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
          </Acc>

          <Acc title="Pre-Treatment Vitals" color="#13A8BD" done={vitalsDone} isOpen={!!sections.vitals} onToggle={() => toggle("vitals")} colors={colors} isReadOnly={isReadOnly}>
            <VitalsForm vitals={vitals} bpSite={bpSite} method={method} onVitalChange={updateVital} onBpSiteChange={setBpSite} onMethodChange={setMethod} colors={colors} />
          </Acc>

          <Acc title="Machines" color="#8B5CF6" done={machineDone} isOpen={!!sections.machines} onToggle={() => toggle("machines")} colors={colors} isReadOnly={isReadOnly}>
            <MachinesForm machine={machine} onChange={setMachine} colors={colors} />
          </Acc>

          <Acc title="Pain Assessment" color="#EF4444" done={painDone} isOpen={!!sections.pain} onToggle={() => toggle("pain")} colors={colors} isReadOnly={isReadOnly}>
            <PainForm painScore={pain} painDetails={painDetails} onScoreChange={setPain} onDetailsChange={setPainDetails} colors={colors} />
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
          </Acc>

          <Acc title="Nursing Action" color="#10B981" done={nursingDone} isOpen={!!sections.nursing} onToggle={() => toggle("nursing")} colors={colors} isReadOnly={isReadOnly}>
            <NursingActionForm rows={nursingActions} onChange={setNursingActions} colors={colors} />
          </Acc>

          <Acc title="Dialysis Parameters" color="#3B82F6" done={dialysisDone} isOpen={!!sections.dialysis} onToggle={() => toggle("dialysis")} colors={colors} isReadOnly={isReadOnly}>
            <DialysisParamsForm rows={dialysisParams} onChange={setDialysisParams} colors={colors} />
          </Acc>

          <Acc title="Alarms Test" color="#F97316" done={alarmsTest} isOpen={!!sections.alarms} onToggle={() => toggle("alarms")} colors={colors} isReadOnly={isReadOnly}>
            <AlarmsTestForm passed={alarmsTest} onChange={setAlarmsTest} colors={colors} />
          </Acc>

          <Acc title="Intake / Output" color="#06B6D4" done={intakeDone} isOpen={!!sections.intake} onToggle={() => toggle("intake")} colors={colors} isReadOnly={isReadOnly}>
            <IntakeOutputForm intake={intake} output={output} onIntakeChange={setIntake} onOutputChange={setOutput} colors={colors} />
          </Acc>

          <Acc title="CAR" color="#8B5CF6" done={carDone} isOpen={!!sections.car} onToggle={() => toggle("car")} colors={colors} isReadOnly={isReadOnly}>
            <CarForm car={car} onChange={setCar} colors={colors} />
          </Acc>

          <Acc title="Access / Location" color="#10B981" done={accessDone} isOpen={!!sections.access} onToggle={() => toggle("access")} colors={colors} isReadOnly={isReadOnly}>
            <AccessForm value={access} onChange={setAccess} />
          </Acc>

          <Acc title="Dialysate" color="#3B82F6" done={dialysateDone} isOpen={!!sections.dialysate} onToggle={() => toggle("dialysate")} colors={colors} isReadOnly={isReadOnly}>
            <DialysateForm dialysate={dialysate} onChange={setDialysate} colors={colors} />
          </Acc>

          <Acc title="Anticoagulation" color="#EF4444" done={anticoagDone} isOpen={!!sections.anticoag} onToggle={() => toggle("anticoag")} colors={colors} isReadOnly={isReadOnly}>
            <AnticoagForm type={anticoagType} onChange={setAnticoagType} colors={colors} />
          </Acc>

          <Acc title="Dialysis Medications" color="#0891B2" done={medsDone} isOpen={!!sections.meds} onToggle={() => toggle("meds")} colors={colors} isReadOnly={isReadOnly}>
            <DialysisMedsForm medications={props.medications} medAdmin={props.medAdmin} onAction={props.onMedAction} colors={colors} />
          </Acc>

          <Acc title="Post Treatment Assessment" color="#6366F1" done={postDone} isOpen={!!sections.post} onToggle={() => toggle("post")} colors={colors} isReadOnly={isReadOnly}>
            <PostTreatmentForm
              postTx={postTx}
              patientSigned={props.patientSigned}
              nurseSigned={props.nurseSigned}
              onChange={setPostTx}
              onOpenPatientSignature={props.onOpenPatientSignature}
              onOpenNurseSignature={props.onOpenNurseSignature}
              colors={colors}
            />
          </Acc>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <Pressable style={[s.saveFlowBtn, { backgroundColor: Colors.primary, flex: 1 }]} onPress={handleSave}>
              <Feather name="save" size={16} color="#fff" />
              <Text style={s.mainBtnText}>Save</Text>
            </Pressable>
            <Pressable style={[s.saveFlowBtn, { backgroundColor: "#EF4444", flex: 1 }]} onPress={handleClear}>
              <Feather name="trash-2" size={16} color="#fff" />
              <Text style={s.mainBtnText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Card>
  );
}
