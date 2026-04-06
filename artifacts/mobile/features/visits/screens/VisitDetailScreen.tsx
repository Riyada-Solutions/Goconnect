import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
import { useApp } from "@/context/AppContext";
import { MOCK_PATIENT_ALERTS, MOCK_PATIENTS } from "@/features/patients/services/mockPatientData";
import { MOCK_SLOTS } from "@/features/scheduler/services/mockSchedulerData";
import { MOCK_DIALYSIS_MEDICATIONS, MOCK_INVENTORY, MOCK_VISITS } from "@/features/visits/services/mockVisitData";
import { useTheme } from "@/hooks/useTheme";



// ─── Collapsible Section ──────────────────────────────────────────────────────
function CollapsibleHeader({
  title,
  icon,
  iconColor,
  badges,
  expanded,
  onToggle,
  colors,
}: {
  title: string;
  icon: string;
  iconColor: string;
  badges?: { text: string; bg: string; fg: string }[];
  expanded: boolean;
  onToggle: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      style={[
        s.collapsibleHeader,
        { borderBottomColor: expanded ? colors.borderLight : "transparent" },
      ]}
    >
      <Feather name={icon as any} size={16} color={iconColor} />
      <Text style={[s.collapsibleTitle, { color: colors.text }]}>{title}</Text>
      {badges?.map((b, i) => (
        <View key={i} style={[s.badge, { backgroundColor: b.bg }]}>
          <Text style={[s.badgeText, { color: b.fg }]}>{b.text}</Text>
        </View>
      ))}
      <Feather
        name={expanded ? "chevron-up" : "chevron-down"}
        size={18}
        color={colors.textTertiary}
        style={{ marginLeft: "auto" }}
      />
    </Pressable>
  );
}

// ─── Flow Sheet Form Field ────────────────────────────────────────────────────
function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  half,
  keyboardType,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  colors: any;
  half?: boolean;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  editable?: boolean;
}) {
  return (
    <View style={[s.formField, half && { flex: 1 }]}>
      <Text style={[s.formLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          s.formInput,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ""}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType ?? "default"}
        editable={editable}
      />
    </View>
  );
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  if (h > 0) return `${h}h ${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function formatTime(d: Date): string {
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// ─── Radio Option ─────────────────────────────────────────────────────────────
function RadioOption({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={s.radioRow}
    >
      <View
        style={[
          s.radioOuter,
          { borderColor: selected ? Colors.primary : colors.border },
        ]}
      >
        {selected && <View style={s.radioInner} />}
      </View>
      <Text style={[s.radioLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Use Items Modal ──────────────────────────────────────────────────────────
function UseItemsModal({
  visible,
  item,
  onClose,
  onUse,
  colors,
}: {
  visible: boolean;
  item: (typeof MOCK_INVENTORY)[0] | null;
  onClose: () => void;
  onUse: (qty: number, notes: string) => void;
  colors: any;
}) {
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[s.modalHeader, { backgroundColor: Colors.primary }]}>
            <MaterialCommunityIcons name="package-variant" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={s.modalHeaderTitle}>Use Items from Patient Inventory</Text>
              <Text style={s.modalHeaderSub}>
                Adjust usage and inventory will be updated automatically
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={{ padding: 16 }} contentContainerStyle={{ gap: 16 }}>
            {/* Item info */}
            <View style={s.modalItemRow}>
              <View style={[s.modalItemBox, { borderColor: colors.border }]}>
                <Text style={[s.modalItemLabel, { color: colors.textSecondary }]}>ITEM</Text>
                <Text style={[s.modalItemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[s.modalItemCode, { color: colors.textTertiary }]}>
                  # {item.itemNumber}
                </Text>
              </View>
              <View style={[s.modalItemBox, { borderColor: Colors.primary }]}>
                <Text style={[s.modalItemLabel, { color: Colors.primary }]}>
                  AVAILABLE QUANTITY
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={[s.qtyBadge, { backgroundColor: `${Colors.primary}20` }]}>
                    <Text style={{ color: Colors.primary, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                      {item.available}
                    </Text>
                  </View>
                  <Text style={[s.qtyAvailText, { color: colors.text }]}>items available</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Feather name="info" size={12} color={Colors.primary} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                    Current available stock for this patient
                  </Text>
                </View>
              </View>
            </View>

            {/* Usage Details */}
            <View style={[s.modalUsageBox, { backgroundColor: colors.background }]}>
              <Text style={[s.modalUsageTitle, { color: colors.text }]}>Usage Details</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                Enter used quantity for this visit
              </Text>

              <Text style={[s.formLabel, { color: colors.text, marginTop: 14 }]}>
                Total Used Quantity For Visit <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View
                style={[
                  s.qtyInputRow,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              >
                <MaterialCommunityIcons
                  name="package-variant"
                  size={18}
                  color={colors.textTertiary}
                />
                <TextInput
                  style={[s.qtyInput, { color: colors.text }]}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                  items
                </Text>
              </View>

              <View style={s.qtyInfo}>
                <Feather name="refresh-cw" size={12} color="#F59E0B" />
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular", flex: 1 }}>
                  Adjusting this value will automatically add/deduct items from the patient
                  inventory. Current available: {item.available} items.
                </Text>
              </View>
            </View>

            {/* Notes */}
            <View>
              <Text style={[s.formLabel, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[
                  s.formInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    minHeight: 60,
                    textAlignVertical: "top",
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes about this usage"
                placeholderTextColor={colors.textTertiary}
                multiline
              />
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={s.modalFooter}>
            <Pressable
              style={[s.modalCancelBtn, { backgroundColor: "#EF4444" }]}
              onPress={onClose}
            >
              <Feather name="x" size={14} color="#fff" />
              <Text style={s.modalBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[s.modalUseBtn, { backgroundColor: Colors.primary }]}
              onPress={() => {
                const n = parseInt(qty, 10);
                if (!n || n <= 0) {
                  Alert.alert("Invalid", "Enter a valid quantity.");
                  return;
                }
                if (n > item.available) {
                  Alert.alert("Exceeded", "Quantity exceeds available stock.");
                  return;
                }
                onUse(n, notes);
                setQty("1");
                setNotes("");
              }}
            >
              <Feather name="check" size={14} color="#fff" />
              <Text style={s.modalBtnText}>Use Items</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════════════════════════════
export default function VisitDetailScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const { t } = useApp();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 32);

  const isSlot = mode === "slot";
  const record = isSlot
    ? MOCK_SLOTS.find((sl) => String(sl.id) === id)
    : MOCK_VISITS.find((v) => String(v.id) === id);

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
  const [visitTimerStart, setVisitTimerStart] = useState<number | null>(
    initialPhase === "in_progress" ? Date.now() : null,
  );
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [procedureTimerStart, setProcedureTimerStart] = useState<number | null>(
    initialPhase === "start_procedure" ? Date.now() : null,
  );
  const [visitElapsed, setVisitElapsed] = useState(0);
  const [procedureElapsed, setProcedureElapsed] = useState(0);
  const [procedureStartTimeStr, setProcedureStartTimeStr] = useState("--:-- --");
  const [procedureEndTimeStr, setProcedureEndTimeStr] = useState("--:-- --");
  const [showProcedureEdit, setShowProcedureEdit] = useState(false);
  const [editProcStart, setEditProcStart] = useState("");
  const [editProcEnd, setEditProcEnd] = useState("");
  const visitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const procTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isReadOnly = visitPhase === "completed";

  useEffect(() => {
    if (visitTimerStart) {
      visitTimerRef.current = setInterval(() => {
        setVisitElapsed(Date.now() - visitTimerStart);
      }, 1000);
    }
    return () => { if (visitTimerRef.current) clearInterval(visitTimerRef.current); };
  }, [visitTimerStart]);

  useEffect(() => {
    if (procedureTimerStart) {
      procTimerRef.current = setInterval(() => {
        setProcedureElapsed(Date.now() - procedureTimerStart);
      }, 1000);
    }
    return () => { if (procTimerRef.current) clearInterval(procTimerRef.current); };
  }, [procedureTimerStart]);

  const handleStartProcedure = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisitPhase("start_procedure");
    if (visitTimerRef.current) clearInterval(visitTimerRef.current);
    const now = Date.now();
    setProcedureTimerStart(now);
    setProcedureStartTimeStr(formatTime(new Date(now)));
    setEditProcStart(formatTime(new Date(now)));
  }, []);

  const handleEndProcedure = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setVisitPhase("end_procedure");
    setProcedureEndTimeStr(formatTime(new Date()));
    setEditProcEnd(formatTime(new Date()));
    if (procTimerRef.current) clearInterval(procTimerRef.current);
  }, []);

  // Collapsible states
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [flowOpen, setFlowOpen] = useState(false);
  const [flowMobileOpen, setFlowMobileOpen] = useState(initialPhase === "completed");
  const [inventoryOpen, setInventoryOpen] = useState(true);

  // Flow Sheet form state
  const [flowVitals, setFlowVitals] = useState({
    height: "",
    preWeight: "",
    bmi: "",
    dryWeight: "",
    ufGoal: "",
    bpSystolic: "",
    bpDiastolic: "",
    bpSite: "",
    temperature: "",
    method: "",
    spo2: "",
    hr: "",
    rr: "",
    rbs: "",
  });
  const [painScore, setPainScore] = useState("");
  const [fallRisk, setFallRisk] = useState("");
  const [intake, setIntake] = useState("");
  const [output, setOutput] = useState("");
  const [accessType, setAccessType] = useState("");
  const [outsideDialysis, setOutsideDialysis] = useState(true);
  const [alarmsTestPassed, setAlarmsTestPassed] = useState(false);
  const [machine, setMachine] = useState("");
  const [painDetails, setPainDetails] = useState({
    toolUsed: "", location: "", frequency: "", radiatingTo: "",
    painType: "", occurs: "", ambulating: "", resting: "",
    eating: "", relievedBy: "", worsensBy: "",
  });
  const [highRisk, setHighRisk] = useState(false);
  const [physicianNotified, setPhysicianNotified] = useState(false);

  const [nursingActions, setNursingActions] = useState<{ time: string; focus: string; action: string; evaluation: string; name: string }[]>([
    { time: "", focus: "", action: "", evaluation: "", name: "" },
  ]);
  const [dialysisParams, setDialysisParams] = useState<{
    time: string; systolic: string; diastolic: string; site: string; pulse: string;
    dialysateRate: string; uf: string; bfr: string; dialysateVol: string; ufVol: string;
    venous: string; effluent: string; access: string; alarms: string; initials: string;
  }[]>([
    { time: "", systolic: "", diastolic: "", site: "", pulse: "", dialysateRate: "", uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "", access: "", alarms: "", initials: "" },
  ]);
  const [car, setCar] = useState({ ffPercent: "", dialyzer: "", temp: "" });
  const [dialysate, setDialysate] = useState({ na: "", hco3: "", k: "", glucose: "" });
  const [anticoagType, setAnticoagType] = useState("");
  const [postTx, setPostTx] = useState({
    bpSystolic: "", bpDiastolic: "", bpSite: "", pulse: "", temp: "", method: "",
    spo2: "", rr: "", rbs: "", weight: "", txHr: "", txMin: "", txL: "",
    dialysateL: "", ufL: "", blp: "",
    catheterLock: "", arterialAccess: "", venousAccess: "", ufNet: "",
    machineDisinfected: true,
    accessBleeding: "", needleHeld: "", medicalComplaints: "",
    nonMedicalIncidence: "", initials: "",
  });

  // Flow Sheet Mobile state
  const [mVitals, setMVitals] = useState({
    height: "", preWeight: "", dryWeight: "", ufGoal: "",
    bpSystolic: "", bpDiastolic: "",
    temperature: "", spo2: "", hr: "", rr: "", rbs: "",
  });
  const [mPain, setMPain] = useState("");
  const [mFallRisk, setMFallRisk] = useState("");
  const [mIntake, setMIntake] = useState("");
  const [mOutput, setMOutput] = useState("");
  const [mAccess, setMAccess] = useState("");
  const [mOutsideDialysis, setMOutsideDialysis] = useState(false);
  const [mAlarmsTest, setMAlarmsTest] = useState(false);
  const [mHighFallRisk, setMHighFallRisk] = useState(false);

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
  const [mBpSite, setMBpSite] = useState("");
  const [mMethod, setMMethod] = useState("");
  const [mMachine, setMMachine] = useState("");
  const [mNursingActions, setMNursingActions] = useState([{ time: "", focus: "", action: "", evaluation: "", name: "" }]);
  const [mDialysisParams, setMDialysisParams] = useState([{ time: "", systolic: "", diastolic: "", site: "", pulse: "", dialysateRate: "", uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "", access: "", alarms: "", initials: "" }]);
  const [mCar, setMCar] = useState({ ffPercent: "", dialyzer: "", temp: "" });
  const [mDialysate, setMDialysate] = useState({ na: "", hco3: "", k: "", glucose: "" });
  const [mAnticoagType, setMAnticoagType] = useState("");
  const [mPostTx, setMPostTx] = useState({ postWeight: "", lastBp: "", lastPulse: "", condition: "", notes: "" });
  const [mPainDetails, setMPainDetails] = useState({ toolUsed: "", location: "", frequency: "", radiatingTo: "", painType: "", occurs: "", ambulating: "", resting: "", eating: "", relievedBy: "", worsensBy: "" });

  const updateMVital = useCallback((key: keyof typeof mVitals, val: string) =>
    setMVitals((prev) => ({ ...prev, [key]: val })), []);

  const ALL_FM_SECTIONS_OPEN: Record<string, boolean> = {
    outside: true, vitals: true, machines: true, pain: true, fall: true,
    nursing: true, dialysis: true, alarms: true, intake: true, car: true,
    access: true, dialysate: true, anticoag: true, meds: true, post: true,
    fs_outside: true, fs_vitals: true, fs_machines: true, fs_pain: true, fs_fall: true,
    fs_nursing: true, fs_dialysis: true, fs_alarms: true, fs_access: true, fs_car: true,
    fs_dialysate: true, fs_anticoag: true, fs_meds: true, fs_post: true,
  };
  const [fmSections, setFmSections] = useState<Record<string, boolean>>(
    initialPhase === "completed" ? ALL_FM_SECTIONS_OPEN : {},
  );
  const toggleFmSection = useCallback((key: string) => setFmSections((prev) => ({ ...prev, [key]: !prev[key] })), []);

  const [flowPageOpen, setFlowPageOpen] = useState(initialPhase === "completed");
  const [fsPage, setFsPage] = useState(0);
  const FS_TOTAL_PAGES = 15;

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
      Alert.prompt
        ? Alert.prompt("Reason", "Enter reason for not administering:", (reason) => {
            setMedAdmin((prev) => ({ ...prev, [medId]: { status: "no", timestamp: new Date().toLocaleString(), reason: reason || "" } }));
          })
        : Alert.alert("Not Administered", "Medication marked as not administered.", [
            { text: "OK", onPress: () => setMedAdmin((prev) => ({ ...prev, [medId]: { status: "no", timestamp: new Date().toLocaleString(), reason: "Declined" } })) },
          ]);
    } else {
      setMedAdmin((prev) => ({ ...prev, [medId]: { status: "yes", timestamp: new Date().toLocaleString(), reason: "" } }));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Inventory modal
  const [useModalVisible, setUseModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<(typeof MOCK_INVENTORY)[0] | null>(null);
  const [inventoryItems, setInventoryItems] = useState(MOCK_INVENTORY.map((i) => ({ ...i })));

  if (!record) {
    return (
      <View
        style={[
          s.container,
          { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={{ color: colors.text }}>Visit not found</Text>
      </View>
    );
  }

  const phone = (record as any).phone as string | undefined;
  const address = (record as any).address as string | undefined;
  const medicalTeam = (record as any).medicalTeam as { name: string; role: string; phone?: string }[] | undefined;
  const patientId = (record as any).patientId as number | undefined;
  const patientName = (record as any).patientName as string | undefined;
  const alerts = patientId ? MOCK_PATIENT_ALERTS[patientId] : undefined;
  const patientRecord = patientId ? MOCK_PATIENTS.find((p) => p.id === patientId) : undefined;
  const patientBloodType = patientRecord?.bloodType;
  const patientStatus = patientRecord?.status;
  const patientDiagnosis = (record as any).diagnosis as string | undefined || patientRecord?.diagnosis;

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

  const updateVital = (key: keyof typeof flowVitals, val: string) =>
    setFlowVitals((prev) => ({ ...prev, [key]: val }));

  const Acc = ({ id, title, color, done, children }: { id: string; title: string; color: string; done: boolean; children: React.ReactNode }) => (
    <View style={[ms.borderedSection, { borderLeftColor: color, backgroundColor: colors.card }]}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleFmSection(id); }}
        style={[ms.accHeader, { backgroundColor: `${color}18` }]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          {done && <View style={ms.checkCircle}><Feather name="check" size={12} color="#fff" /></View>}
          <Text style={[ms.accHeaderText, { color }]}>{title}</Text>
        </View>
        <Feather name={fmSections[id] ? "chevron-up" : "chevron-down"} size={18} color={color} />
      </Pressable>
      {fmSections[id] && (
        <View style={ms.sectionBody} pointerEvents={isReadOnly ? "none" : "auto"}>
          <View>{children}</View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View
        style={[
          s.topBar,
          { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => { Haptics.selectionAsync(); router.back(); }} style={s.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.topTitle, { color: colors.text }]} numberOfLines={1}>
          Visit Details
        </Text>
        <View style={s.topActions} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: botPad + 16 }} showsVerticalScrollIndicator={false}>
        {/* Patient Hero */}
        {patientName && (
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <View style={[s.heroCard, { backgroundColor: isDark ? Colors.dark.card : "#fff" }]}>
              <Pressable
                onPress={() => {
                  if (patientId) { Haptics.selectionAsync(); router.push({ pathname: "/patients/[id]", params: { id: patientId } }); }
                }}
                style={s.heroTop}
              >
                <Avatar name={patientName} size={54} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.heroName, { color: colors.text }]}>{patientName}</Text>
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
              {(phone || address) && (
                <View style={[s.heroActions, { borderTopColor: colors.borderLight }]}>
                  {phone && <ActionButton type="call" value={phone} />}
                  {address && <ActionButton type="location" value={address} />}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* ─── Visit Info ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(70).springify()} style={s.section}>
          <Card style={s.sectionCard}>
            <View style={s.visitInfoGrid}>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Visit Date</Text>
                <Text style={[s.visitInfoValue, { color: colors.text }]}>{visitDate || (record as any).date || "—"}</Text>
              </View>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Procedure Time</Text>
                <Pressable
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}
                  onPress={() => {
                    if (visitPhase === "start_procedure" || visitPhase === "end_procedure") {
                      setShowProcedureEdit(!showProcedureEdit);
                    }
                  }}
                >
                  <Text style={[s.visitInfoValue, { color: colors.text }]}>
                    {procedureStartTimeStr !== "--:-- --" ? procedureStartTimeStr : (procedureTime || "—")}
                    {procedureEndTimeStr !== "--:-- --" ? ` – ${procedureEndTimeStr}` : ""}
                  </Text>
                  {(visitPhase === "start_procedure" || visitPhase === "end_procedure") && procedureElapsed > 0 && (
                    <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#22C55E" }}>
                      {formatElapsed(procedureElapsed)}
                    </Text>
                  )}
                  {(visitPhase === "start_procedure" || visitPhase === "end_procedure") && (
                    <Feather name="edit-2" size={11} color={colors.textTertiary} />
                  )}
                </Pressable>
              </View>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Visit Time</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[s.visitInfoValue, { color: colors.text }]}>{visitTime || (record as any).time || "—"}</Text>
                  {visitElapsed > 0 && (
                    <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#DC2626" }}>
                      {formatElapsed(visitElapsed)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={[s.visitInfoDivider, { backgroundColor: colors.borderLight }]} />

            <View style={s.visitInfoGrid}>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Status</Text>
                <StatusBadge status={
                  visitPhase === "completed" ? "completed" :
                  visitPhase === "end_procedure" ? "end procedure" :
                  visitPhase === "start_procedure" ? "start procedure" :
                  "in progress"
                } />
              </View>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Patient</Text>
                <Text style={[s.visitInfoValue, { color: colors.text }]} numberOfLines={1}>{patientName || "—"}</Text>
              </View>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Hospital</Text>
                <Text style={[s.visitInfoValue, { color: colors.text }]} numberOfLines={1}>{hospital || "—"}</Text>
              </View>
            </View>

            <View style={[s.visitInfoDivider, { backgroundColor: colors.borderLight }]} />

            <View style={s.visitInfoGrid}>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Insurance / Grant</Text>
                <Text style={[s.visitInfoValue, { color: colors.text }]}>{insurance || "N/A"}</Text>
              </View>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Providers</Text>
                <Text style={[s.visitInfoValue, { color: colors.text }]} numberOfLines={1}>
                  {(record as any).provider || "—"}
                </Text>
              </View>
              <View style={s.visitInfoCell}>
                <Text style={[s.visitInfoLabel, { color: colors.textTertiary }]}>Doctor Time</Text>
                <Text style={[s.visitInfoValue, { color: doctorTime === "Not started" ? "#F59E0B" : colors.text }]}>
                  {doctorTime || "—"}
                </Text>
              </View>
            </View>
          </Card>

          {showProcedureEdit && (
            <Card style={[s.sectionCard, { marginTop: 12 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Feather name="clock" size={16} color={Colors.primary} />
                <Text style={[s.visitInfoValue, { color: colors.text }]}>
                  Procedure Time: {procedureStartTimeStr}
                </Text>
                {procedureElapsed > 0 && (
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#22C55E" }}>
                    {formatElapsed(procedureElapsed)}
                  </Text>
                )}
                <Pressable onPress={() => setShowProcedureEdit(false)} style={{ marginLeft: "auto" }}>
                  <Feather name="edit-2" size={14} color={Colors.primary} />
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.formLabel, { color: colors.text }]}>Start</Text>
                  <View style={[s.procTimeInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <TextInput
                      style={[s.procTimeText, { color: colors.text }]}
                      value={editProcStart}
                      onChangeText={setEditProcStart}
                      placeholder="--:-- --"
                      placeholderTextColor={colors.textTertiary}
                      editable={!isReadOnly}
                    />
                    <Feather name="clock" size={16} color={colors.textTertiary} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.formLabel, { color: colors.text }]}>End</Text>
                  <View style={[s.procTimeInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <TextInput
                      style={[s.procTimeText, { color: colors.text }]}
                      value={editProcEnd}
                      onChangeText={setEditProcEnd}
                      placeholder="--:-- --"
                      placeholderTextColor={colors.textTertiary}
                      editable={!isReadOnly}
                    />
                    <Feather name="clock" size={16} color={colors.textTertiary} />
                  </View>
                </View>
              </View>

              {!isReadOnly && (
                <Pressable
                  style={[s.procSaveBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (editProcStart) setProcedureStartTimeStr(editProcStart);
                    if (editProcEnd) setProcedureEndTimeStr(editProcEnd);
                    setShowProcedureEdit(false);
                  }}
                >
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Save</Text>
                </Pressable>
              )}
            </Card>
          )}
        </Animated.View>

        {isReadOnly && (
          <Animated.View entering={FadeInDown.delay(75).springify()} style={[s.section]}>
            <View style={s.readOnlyBanner}>
              <Feather name="lock" size={14} color="#fff" />
              <Text style={s.readOnlyBannerText}>Procedure ended — all forms are read-only</Text>
            </View>
          </Animated.View>
        )}

        {/* ─── Patient Alerts & Instructions ─────────────────────────────── */}
        {alerts && alertCount > 0 && (
          <Animated.View entering={FadeInDown.delay(80).springify()} style={s.section}>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <CollapsibleHeader
                title="Patient Alerts & Instructions"
                icon="alert-triangle"
                iconColor="#F59E0B"
                badges={[
                  ...(alerts.allergies.length ? [{ text: String(alerts.allergies.length), bg: "#FEE2E2", fg: "#DC2626" }] : []),
                  ...(alerts.contamination.length ? [{ text: String(alerts.contamination.length), bg: "#FEF3C7", fg: "#D97706" }] : []),
                  ...(alerts.isolation ? [{ text: "Isolation", bg: "#DBEAFE", fg: "#2563EB" }] : []),
                ]}
                expanded={alertsOpen}
                onToggle={() => setAlertsOpen(!alertsOpen)}
                colors={colors}
              />
              {alertsOpen && (
                <View style={{ padding: 12, gap: 10 }}>
                  {/* Allergies & Contamination */}
                  {(alerts.allergies.length > 0 || alerts.contamination.length > 0) && (
                    <View style={[s.alertCard, { backgroundColor: "#FEF2F2", borderLeftColor: "#EF4444" }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <Feather name="alert-triangle" size={14} color="#DC2626" />
                        <Text style={s.alertCardTitle}>ALLERGIES & CONTAMINATION</Text>
                      </View>
                      {alerts.allergies.map((a, i) => (
                        <View key={i} style={s.alertRow}>
                          <MaterialCommunityIcons name="pill" size={14} color="#DC2626" />
                          <Text style={s.alertRowText}>
                            <Text style={{ fontFamily: "Inter_600SemiBold" }}>{a.type}:</Text> {a.value}
                          </Text>
                        </View>
                      ))}
                      {alerts.contamination.map((c, i) => (
                        <View key={`c-${i}`} style={s.alertRow}>
                          <MaterialCommunityIcons name="biohazard" size={14} color="#DC2626" />
                          <Text style={s.alertRowText}>
                            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Contamination:</Text> {c}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Instructions */}
                  {alerts.instructions ? (
                    <View style={[s.alertCard, { backgroundColor: "#F59E0B18", borderLeftColor: "#F59E0B" }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Feather name="file-text" size={14} color="#F59E0B" />
                        <Text style={[s.alertCardTitle, { color: "#F59E0B" }]}>INSTRUCTIONS</Text>
                      </View>
                      <Text style={[s.alertInstrText, { color: colors.text }]}>{alerts.instructions}</Text>
                    </View>
                  ) : null}

                  {/* Isolation */}
                  {alerts.isolation ? (
                    <View style={[s.alertCard, { backgroundColor: "#3B82F618", borderLeftColor: "#3B82F6" }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Feather name="shield" size={14} color="#3B82F6" />
                        <Text style={[s.alertCardTitle, { color: "#3B82F6" }]}>ISOLATION</Text>
                      </View>
                      <Text style={[s.alertInstrText, { color: colors.text }]}>
                        Isolation = {alerts.isolation}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </Card>
          </Animated.View>
        )}


        {/* ─── Care Team ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <CareTeamCard
            provider={(record as any).provider}
            medicalTeam={medicalTeam}
            colors={colors}
            animDelay={140}
          />
        </View>

        {/* ─── Flow Sheet ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={s.section}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <CollapsibleHeader
              title="Flow Sheet"
              icon="clipboard"
              iconColor={Colors.primary}
              expanded={flowOpen}
              onToggle={() => setFlowOpen(!flowOpen)}
              colors={colors}
            />
            {flowOpen && (
              <View style={{ padding: 14, gap: 0 }} pointerEvents={isReadOnly ? "none" : "auto"}>
                <Acc id="fs_outside" title="Outside Dialysis" color="#0EA5E9" done={outsideDialysis}>
                  <View style={ms.switchRow}>
                    <Text style={[ms.switchLabel, { color: colors.text }]}>Did You Have Outside Dialysis?</Text>
                    <Switch value={outsideDialysis} onValueChange={setOutsideDialysis} trackColor={{ false: colors.border, true: `${Colors.primary}60` }} thumbColor={outsideDialysis ? Colors.primary : "#f4f3f4"} />
                  </View>
                </Acc>

                <Acc id="fs_vitals" title="Pre-Treatment Vitals" color="#13A8BD" done={Object.values(flowVitals).some((v) => v !== "")}>
                  <View style={s.formRow}>
                    <FormField label="Height (Cm)" value={flowVitals.height} onChangeText={(v) => updateVital("height", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="Pre Weight (Kg)" value={flowVitals.preWeight} onChangeText={(v) => updateVital("preWeight", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="BMI" value={flowVitals.bmi} onChangeText={(v) => updateVital("bmi", v)} colors={colors} half keyboardType="decimal-pad" />
                    <FormField label="Dry Weight (Kg)" value={flowVitals.dryWeight} onChangeText={(v) => updateVital("dryWeight", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                  <FormField label="UF Goal (Kg)" value={flowVitals.ufGoal} onChangeText={(v) => updateVital("ufGoal", v)} colors={colors} keyboardType="decimal-pad" />
                  <Text style={[ms.subLabel, { color: colors.text }]}>BP (mmHg)</Text>
                  <View style={s.formRow}>
                    <FormField label="Systolic" value={flowVitals.bpSystolic} onChangeText={(v) => updateVital("bpSystolic", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="Diastolic" value={flowVitals.bpDiastolic} onChangeText={(v) => updateVital("bpDiastolic", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                  <FormField label="Site" value={flowVitals.bpSite} onChangeText={(v) => updateVital("bpSite", v)} colors={colors} placeholder="Choose" />
                  <View style={s.formRow}>
                    <FormField label="RR (Rpm)" value={flowVitals.rr} onChangeText={(v) => updateVital("rr", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="PR (Bpm)" value={flowVitals.hr} onChangeText={(v) => updateVital("hr", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Temperature (°C)" value={flowVitals.temperature} onChangeText={(v) => updateVital("temperature", v)} colors={colors} half keyboardType="decimal-pad" />
                    <FormField label="Method" value={flowVitals.method} onChangeText={(v) => updateVital("method", v)} colors={colors} half placeholder="Choose" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="SpO2 (%)" value={flowVitals.spo2} onChangeText={(v) => updateVital("spo2", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="RBS (Mg/Dl)" value={flowVitals.rbs} onChangeText={(v) => updateVital("rbs", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                </Acc>

                <Acc id="fs_machines" title="Machines" color="#8B5CF6" done={machine !== ""}>
                  <FormField label="Choose Machine" value={machine} onChangeText={setMachine} colors={colors} placeholder="e.g. 49827 | W45832" />
                </Acc>

                <Acc id="fs_pain" title="Pain Assessment" color="#EF4444" done={painScore !== "" || Object.values(painDetails).some((v) => v !== "")}>
                  <View style={s.formRow}>
                    <FormField label="Tool Used" value={painDetails.toolUsed} onChangeText={(v) => setPainDetails({ ...painDetails, toolUsed: v })} colors={colors} half />
                    <FormField label="Location" value={painDetails.location} onChangeText={(v) => setPainDetails({ ...painDetails, location: v })} colors={colors} half placeholder="Select Location" />
                  </View>
                  <FormField label="Frequency" value={painDetails.frequency} onChangeText={(v) => setPainDetails({ ...painDetails, frequency: v })} colors={colors} placeholder="Select Frequency" />
                  <FormField label="Radiating To" value={painDetails.radiatingTo} onChangeText={(v) => setPainDetails({ ...painDetails, radiatingTo: v })} colors={colors} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <Text style={[ms.subLabel, { color: colors.text, marginTop: 0 }]}>Type:</Text>
                    {["Constant", "Dull", "Sharp"].map((t) => (
                      <RadioOption key={t} label={t} selected={painDetails.painType === t} onPress={() => setPainDetails({ ...painDetails, painType: t })} colors={colors} />
                    ))}
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Occurs" value={painDetails.occurs} onChangeText={(v) => setPainDetails({ ...painDetails, occurs: v })} colors={colors} half />
                    <FormField label="Ambulating" value={painDetails.ambulating} onChangeText={(v) => setPainDetails({ ...painDetails, ambulating: v })} colors={colors} half />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Resting" value={painDetails.resting} onChangeText={(v) => setPainDetails({ ...painDetails, resting: v })} colors={colors} half />
                    <FormField label="Eating" value={painDetails.eating} onChangeText={(v) => setPainDetails({ ...painDetails, eating: v })} colors={colors} half />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Relieved By" value={painDetails.relievedBy} onChangeText={(v) => setPainDetails({ ...painDetails, relievedBy: v })} colors={colors} half />
                    <FormField label="Worsens By" value={painDetails.worsensBy} onChangeText={(v) => setPainDetails({ ...painDetails, worsensBy: v })} colors={colors} half />
                  </View>
                  <Text style={[ms.subLabel, { color: colors.text }]}>Pain Rating Score (0-10)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {[...Array(11)].map((_, i) => (
                      <Pressable key={i} onPress={() => { Haptics.selectionAsync(); setPainScore(String(i)); }} style={[ms.scoreBtn, { backgroundColor: colors.card, borderColor: colors.border }, painScore === String(i) && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                        <Text style={[ms.scoreBtnText, { color: colors.text }, painScore === String(i) && { color: "#fff" }]}>{i}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Acc>

                <Acc id="fs_fall" title="Fall Risk Assessment" color="#F59E0B" done={fallRisk !== ""}>
                  <Text style={[ms.subLabel, { color: colors.text }]}>Fall Risk Score (0-9)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {[...Array(10)].map((_, i) => (
                      <Pressable key={i} onPress={() => { Haptics.selectionAsync(); setFallRisk(String(i)); if (i > 3) { setPhysicianCalled(null); setTimeout(() => setPhysicianModalOpen(true), 150); } }} style={[ms.scoreBtn, { backgroundColor: colors.card, borderColor: colors.border }, fallRisk === String(i) && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                        <Text style={[ms.scoreBtnText, { color: colors.text }, fallRisk === String(i) && { color: "#fff" }]}>{i}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={[ms.switchRow, { marginTop: 10 }]}>
                    <Text style={[ms.switchLabel, { color: colors.text }]}>High Risk?</Text>
                    <Switch value={highRisk} onValueChange={setHighRisk} trackColor={{ false: colors.border, true: `${Colors.primary}60` }} thumbColor={highRisk ? Colors.primary : "#f4f3f4"} />
                  </View>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMorseSheetOpen(true); }} style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F59E0B18", borderWidth: 1.5, borderColor: "#F59E0B", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Feather name="clipboard" size={16} color="#F59E0B" />
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#F59E0B" }}>Morse Fall Scale</Text>
                    </View>
                    {morseComplete
                      ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={{ backgroundColor: morseTotal >= 45 ? "#EF4444" : morseTotal >= 25 ? "#F59E0B" : "#22C55E", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>Score: {morseTotal}</Text>
                          </View>
                          <Feather name="chevron-right" size={14} color="#F59E0B" />
                        </View>
                      : <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#F59E0B" }}>Fill Form</Text>
                          <Feather name="chevron-right" size={14} color="#F59E0B" />
                        </View>}
                  </Pressable>
                  <View style={[ms.noticeBox, { backgroundColor: physicianCalled === "yes" ? "#22C55E18" : physicianCalled === "no" ? "#EF444418" : "#3B82F618" }]}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: physicianCalled === "yes" ? "#22C55E" : physicianCalled === "no" ? "#EF4444" : "#3B82F6" }}>
                      {physicianCalled === "yes" ? "✓ Physician Notified" : physicianCalled === "no" ? "✗ Physician Not Called" : "Physician notification pending"}
                    </Text>
                  </View>
                </Acc>

                <Acc id="fs_nursing" title="Nursing Action" color="#10B981" done={nursingActions.some((r) => Object.values(r).some((v) => v !== ""))}>
                  {nursingActions.map((row, idx) => (
                    <View key={idx} style={[s.dynRow, { backgroundColor: colors.surface, borderColor: colors.border }, idx > 0 && { marginTop: 8 }]}>
                      <View style={s.formRow}>
                        <FormField label="Time" value={row.time} onChangeText={(v) => { const a = [...nursingActions]; a[idx] = { ...a[idx], time: v }; setNursingActions(a); }} colors={colors} half />
                        <FormField label="Focus" value={row.focus} onChangeText={(v) => { const a = [...nursingActions]; a[idx] = { ...a[idx], focus: v }; setNursingActions(a); }} colors={colors} half />
                      </View>
                      <FormField label="Nursing Action" value={row.action} onChangeText={(v) => { const a = [...nursingActions]; a[idx] = { ...a[idx], action: v }; setNursingActions(a); }} colors={colors} />
                      <View style={s.formRow}>
                        <FormField label="Evaluation" value={row.evaluation} onChangeText={(v) => { const a = [...nursingActions]; a[idx] = { ...a[idx], evaluation: v }; setNursingActions(a); }} colors={colors} half />
                        <FormField label="Name" value={row.name} onChangeText={(v) => { const a = [...nursingActions]; a[idx] = { ...a[idx], name: v }; setNursingActions(a); }} colors={colors} half />
                      </View>
                      {nursingActions.length > 1 && (
                        <Pressable onPress={() => setNursingActions(nursingActions.filter((_, i) => i !== idx))} style={s.removeRowBtn}>
                          <Feather name="x" size={14} color="#fff" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                  <Pressable style={[s.addRowBtn, { backgroundColor: Colors.primary, marginTop: 8 }]} onPress={() => setNursingActions([...nursingActions, { time: "", focus: "", action: "", evaluation: "", name: "" }])}>
                    <Feather name="plus" size={14} color="#fff" />
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add Action</Text>
                  </Pressable>
                </Acc>

                <Acc id="fs_dialysis" title="Dialysis Parameters" color="#3B82F6" done={dialysisParams.some((r) => Object.values(r).some((v) => v !== ""))}>
                  {dialysisParams.map((row, idx) => (
                    <View key={idx} style={[s.dynRow, { backgroundColor: colors.surface, borderColor: colors.border }, idx > 0 && { marginTop: 8 }]}>
                      <FormField label="Time" value={row.time} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], time: v }; setDialysisParams(a); }} colors={colors} />
                      <Text style={[ms.subLabel, { color: colors.text }]}>Blood Pressure (mmHg)</Text>
                      <View style={s.formRow}>
                        <FormField label="Systolic" value={row.systolic} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], systolic: v }; setDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                        <FormField label="Diastolic" value={row.diastolic} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], diastolic: v }; setDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                      </View>
                      <View style={s.formRow}>
                        <FormField label="Site" value={row.site} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], site: v }; setDialysisParams(a); }} colors={colors} half placeholder="Choose" />
                        <FormField label="Pulse (bpm)" value={row.pulse} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], pulse: v }; setDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                      </View>
                      <Text style={[ms.subLabel, { color: colors.text }]}>Rates</Text>
                      <View style={s.formRow}>
                        <FormField label="Dialysate (L/hr)" value={row.dialysateRate} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], dialysateRate: v }; setDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                        <FormField label="UF (L/hr)" value={row.uf} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], uf: v }; setDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                      </View>
                      <FormField label="BFR (ml/min)" value={row.bfr} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], bfr: v }; setDialysisParams(a); }} colors={colors} keyboardType="numeric" />
                      <Text style={[ms.subLabel, { color: colors.text }]}>Volumes</Text>
                      <View style={s.formRow}>
                        <FormField label="Dialysate (L/hr)" value={row.dialysateVol} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], dialysateVol: v }; setDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                        <FormField label="UF (L/hr)" value={row.ufVol} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], ufVol: v }; setDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                      </View>
                      <Text style={[ms.subLabel, { color: colors.text }]}>Pressures</Text>
                      <View style={s.formRow}>
                        <FormField label="Venous" value={row.venous} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], venous: v }; setDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                        <FormField label="Effluent" value={row.effluent} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], effluent: v }; setDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                      </View>
                      <FormField label="Access" value={row.access} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], access: v }; setDialysisParams(a); }} colors={colors} keyboardType="numeric" />
                      <View style={s.formRow}>
                        <FormField label="Alarms / Comments" value={row.alarms} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], alarms: v }; setDialysisParams(a); }} colors={colors} half />
                        <FormField label="Initials" value={row.initials} onChangeText={(v) => { const a = [...dialysisParams]; a[idx] = { ...a[idx], initials: v }; setDialysisParams(a); }} colors={colors} half />
                      </View>
                      {dialysisParams.length > 1 && (
                        <Pressable onPress={() => setDialysisParams(dialysisParams.filter((_, i) => i !== idx))} style={s.removeRowBtn}>
                          <Feather name="x" size={14} color="#fff" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                  <Pressable style={[s.addRowBtn, { backgroundColor: Colors.primary, marginTop: 8 }]} onPress={() => setDialysisParams([...dialysisParams, { time: "", systolic: "", diastolic: "", site: "", pulse: "", dialysateRate: "", uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "", access: "", alarms: "", initials: "" }])}>
                    <Feather name="plus" size={14} color="#fff" />
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add Row</Text>
                  </Pressable>
                </Acc>

                <Acc id="fs_alarms" title="Alarms Test" color="#F97316" done={alarmsTestPassed}>
                  <View style={[ms.subHeaderBar, { backgroundColor: "#F9731618", borderRadius: 6 }]}>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#F97316" }}>Alarms Test Passed</Text>
                  </View>
                  <View style={ms.switchRow}>
                    <Text style={[ms.switchLabel, { color: colors.text }]}>Passed?</Text>
                    <Switch value={alarmsTestPassed} onValueChange={setAlarmsTestPassed} trackColor={{ false: colors.border, true: "#F9731660" }} thumbColor={alarmsTestPassed ? "#F97316" : "#f4f3f4"} />
                  </View>
                </Acc>

                <Acc id="fs_access" title="Access / Location" color="#10B981" done={accessType !== ""}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {["AVF", "AVG", "CATHETER", "Permacath"].map((opt) => (
                      <RadioOption key={opt} label={opt} selected={accessType === opt} onPress={() => setAccessType(opt)} colors={colors} />
                    ))}
                  </View>
                </Acc>

                <Acc id="fs_car" title="CAR" color="#8B5CF6" done={Object.values(car).some((v) => v !== "")}>
                  <View style={s.formRow}>
                    <FormField label="FF %" value={car.ffPercent} onChangeText={(v) => setCar({ ...car, ffPercent: v })} colors={colors} half keyboardType="decimal-pad" />
                    <FormField label="Dialyzer" value={car.dialyzer} onChangeText={(v) => setCar({ ...car, dialyzer: v })} colors={colors} half />
                  </View>
                  <FormField label="Temp" value={car.temp} onChangeText={(v) => setCar({ ...car, temp: v })} colors={colors} keyboardType="decimal-pad" />
                </Acc>

                <Acc id="fs_dialysate" title="Dialysate" color="#3B82F6" done={Object.values(dialysate).some((v) => v !== "")}>
                  <Text style={[ms.subLabel, { color: colors.text }]}>Acetate / Bicarbonate</Text>
                  <View style={s.formRow}>
                    <FormField label="Na" value={dialysate.na} onChangeText={(v) => setDialysate({ ...dialysate, na: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="HCO₃" value={dialysate.hco3} onChangeText={(v) => setDialysate({ ...dialysate, hco3: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="K" value={dialysate.k} onChangeText={(v) => setDialysate({ ...dialysate, k: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="Glucose" value={dialysate.glucose} onChangeText={(v) => setDialysate({ ...dialysate, glucose: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                </Acc>

                <Acc id="fs_anticoag" title="Anticoagulation" color="#EF4444" done={anticoagType !== ""}>
                  <FormField label="Anticoagulation Type" value={anticoagType} onChangeText={setAnticoagType} colors={colors} placeholder="Choose..." />
                </Acc>

                <Acc id="fs_meds" title="Dialysis Medications" color="#0891B2" done={Object.keys(medAdmin).length > 0}>
                  {MOCK_DIALYSIS_MEDICATIONS.length === 0 ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10, backgroundColor: "#0891B218", borderRadius: 6 }}>
                      <Feather name="info" size={14} color="#0891B2" />
                      <Text style={{ color: "#0891B2", fontSize: 12, fontFamily: "Inter_500Medium" }}>No dialysis medications found for this patient.</Text>
                    </View>
                  ) : MOCK_DIALYSIS_MEDICATIONS.map((med) => {
                    const admin = medAdmin[med.id];
                    return (
                      <View key={med.id} style={[s.medCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        <Text style={[s.medDrug, { color: colors.text }]}>{med.drugName}</Text>
                        <View style={s.medGrid}>
                          {med.form ? <View style={s.medCell}><Text style={s.medCellLabel}>Form</Text><Text style={[s.medCellVal, { color: colors.text }]}>{med.form}</Text></View> : null}
                          {med.dosage ? <View style={s.medCell}><Text style={s.medCellLabel}>Dosage</Text><Text style={[s.medCellVal, { color: colors.text }]}>{med.dosage}</Text></View> : null}
                          {med.frequency ? <View style={s.medCell}><Text style={s.medCellLabel}>Frequency</Text><Text style={[s.medCellVal, { color: colors.text }]}>{med.frequency}</Text></View> : null}
                          {med.route ? <View style={s.medCell}><Text style={s.medCellLabel}>Route</Text><Text style={[s.medCellVal, { color: colors.text }]}>{med.route}</Text></View> : null}
                          {med.duration ? <View style={s.medCell}><Text style={s.medCellLabel}>Duration</Text><Text style={[s.medCellVal, { color: colors.text }]}>{med.duration}</Text></View> : null}
                          {med.durationPeriod ? <View style={s.medCell}><Text style={s.medCellLabel}>Duration Period</Text><Text style={[s.medCellVal, { color: colors.text }]}>{med.durationPeriod}</Text></View> : null}
                          {med.instructions ? <View style={s.medCell}><Text style={s.medCellLabel}>Instructions</Text><Text style={[s.medCellVal, { color: colors.text }]}>{med.instructions}</Text></View> : null}
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.textSecondary }}>Administered</Text>
                          {admin?.status ? (
                            <View style={{ alignItems: "flex-end", gap: 2 }}>
                              <View style={{ backgroundColor: admin.status === "yes" ? "#22C55E18" : "#EF444418", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: admin.status === "yes" ? "#22C55E" : "#EF4444" }}>{admin.status === "yes" ? "Administered" : "Not Given"}</Text>
                              </View>
                              <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>{admin.timestamp}</Text>
                              {admin.reason ? <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: "#EF4444" }}>Reason: {admin.reason}</Text> : null}
                            </View>
                          ) : (
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              <Pressable onPress={() => handleMedAction(med.id, "yes")} style={[s.medAdminBtn, { backgroundColor: "#22C55E" }]}>
                                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>Yes</Text>
                              </Pressable>
                              <Pressable onPress={() => handleMedAction(med.id, "no")} style={[s.medAdminBtn, { backgroundColor: "#EF4444" }]}>
                                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>No</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </Acc>

                <Acc id="fs_post" title="Post Treatment Assessment" color="#6366F1" done={Object.values(postTx).some((v) => typeof v === "string" && v !== "")}>

                  <Text style={[s.formSubhead, { color: colors.text }]}>BP Sitting (mmHg)</Text>
                  <View style={s.formRow}>
                    <FormField label="Systolic" value={postTx.bpSystolic} onChangeText={(v) => setPostTx({ ...postTx, bpSystolic: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="Diastolic" value={postTx.bpDiastolic} onChangeText={(v) => setPostTx({ ...postTx, bpDiastolic: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                  <FormField label="Site" value={postTx.bpSite} onChangeText={(v) => setPostTx({ ...postTx, bpSite: v })} colors={colors} placeholder="Choose" />
                  <View style={s.formRow}>
                    <FormField label="Pulse (bpm)" value={postTx.pulse} onChangeText={(v) => setPostTx({ ...postTx, pulse: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="Temp" value={postTx.temp} onChangeText={(v) => setPostTx({ ...postTx, temp: v })} colors={colors} half keyboardType="decimal-pad" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Method" value={postTx.method} onChangeText={(v) => setPostTx({ ...postTx, method: v })} colors={colors} half placeholder="Choose" />
                    <FormField label="SpO2 (%)" value={postTx.spo2} onChangeText={(v) => setPostTx({ ...postTx, spo2: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="RR (cpm)" value={postTx.rr} onChangeText={(v) => setPostTx({ ...postTx, rr: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="RBS (mg/dl)" value={postTx.rbs} onChangeText={(v) => setPostTx({ ...postTx, rbs: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                  <FormField label="Weight (Kg)" value={postTx.weight} onChangeText={(v) => setPostTx({ ...postTx, weight: v })} colors={colors} keyboardType="decimal-pad" />

                  <Text style={[s.formSubhead, { color: colors.text }]}>Tx Time</Text>
                  <View style={s.formRow}>
                    <FormField label="Hr" value={postTx.txHr} onChangeText={(v) => setPostTx({ ...postTx, txHr: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="Min" value={postTx.txMin} onChangeText={(v) => setPostTx({ ...postTx, txMin: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Dialysate (L)" value={postTx.dialysateL} onChangeText={(v) => setPostTx({ ...postTx, dialysateL: v })} colors={colors} half keyboardType="decimal-pad" />
                    <FormField label="UF" value={postTx.ufL} onChangeText={(v) => setPostTx({ ...postTx, ufL: v })} colors={colors} half keyboardType="decimal-pad" />
                  </View>
                  <FormField label="BLP" value={postTx.blp} onChangeText={(v) => setPostTx({ ...postTx, blp: v })} colors={colors} />

                  <View style={[{ height: 1, backgroundColor: colors.borderLight, marginVertical: 8 }]} />
                  <View style={s.formRow}>
                    <FormField label="Catheter Lock Used" value={postTx.catheterLock} onChangeText={(v) => setPostTx({ ...postTx, catheterLock: v })} colors={colors} half />
                    <FormField label="Arterial Access" value={postTx.arterialAccess} onChangeText={(v) => setPostTx({ ...postTx, arterialAccess: v })} colors={colors} half />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Venous Access" value={postTx.venousAccess} onChangeText={(v) => setPostTx({ ...postTx, venousAccess: v })} colors={colors} half />
                    <FormField label="UF Net" value={postTx.ufNet} onChangeText={(v) => setPostTx({ ...postTx, ufNet: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 }}>
                    <Text style={[s.formLabel, { color: colors.text, marginBottom: 0 }]}>Machine Disinfected</Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <RadioOption label="YES" selected={postTx.machineDisinfected} onPress={() => setPostTx({ ...postTx, machineDisinfected: true })} colors={colors} />
                      <RadioOption label="NO" selected={!postTx.machineDisinfected} onPress={() => setPostTx({ ...postTx, machineDisinfected: false })} colors={colors} />
                    </View>
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Access / Bleeding?" value={postTx.accessBleeding} onChangeText={(v) => setPostTx({ ...postTx, accessBleeding: v })} colors={colors} half />
                    <FormField label="Needle Held" value={postTx.needleHeld} onChangeText={(v) => setPostTx({ ...postTx, needleHeld: v })} colors={colors} half />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Medical Complaints?" value={postTx.medicalComplaints} onChangeText={(v) => setPostTx({ ...postTx, medicalComplaints: v })} colors={colors} half />
                    <FormField label="Non-Medical Incidence?" value={postTx.nonMedicalIncidence} onChangeText={(v) => setPostTx({ ...postTx, nonMedicalIncidence: v })} colors={colors} half />
                  </View>
                  <FormField label="Initials" value={postTx.initials} onChangeText={(v) => setPostTx({ ...postTx, initials: v })} colors={colors} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
                    <Text style={[s.formLabel, { color: colors.text, marginBottom: 0 }]}>Signature</Text>
                    <Pressable
                      style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        Alert.alert("Signature", "Digital signature capture coming soon.");
                      }}
                    >
                      <Feather name="edit-3" size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Click to Sign</Text>
                    </Pressable>
                  </View>
                </Acc>

                {/* Save / Clear / Print */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    style={[s.saveFlowBtn, { backgroundColor: Colors.primary, flex: 1 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert("Saved", "Flow sheet data saved successfully.");
                    }}
                  >
                    <Feather name="save" size={16} color="#fff" />
                    <Text style={s.mainBtnText}>Save</Text>
                  </Pressable>
                  <Pressable
                    style={[s.saveFlowBtn, { backgroundColor: "#22C55E", flex: 1 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFlowVitals({ height: "", preWeight: "", bmi: "", dryWeight: "", ufGoal: "", bpSystolic: "", bpDiastolic: "", bpSite: "", temperature: "", method: "", spo2: "", hr: "", rr: "", rbs: "" });
                      setPainScore(""); setFallRisk(""); setIntake(""); setOutput(""); setAccessType("");
                      setOutsideDialysis(true); setAlarmsTestPassed(false);
                      setMachine(""); setPainDetails({ toolUsed: "", location: "", frequency: "", radiatingTo: "", painType: "", occurs: "", ambulating: "", resting: "", eating: "", relievedBy: "", worsensBy: "" });
                      setHighRisk(false); setPhysicianNotified(false);
                      setNursingActions([{ time: "", focus: "", action: "", evaluation: "", name: "" }]);
                      setDialysisParams([{ time: "", systolic: "", diastolic: "", site: "", pulse: "", dialysateRate: "", uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "", access: "", alarms: "", initials: "" }]);
                      setCar({ ffPercent: "", dialyzer: "", temp: "" }); setDialysate({ na: "", hco3: "", k: "", glucose: "" }); setAnticoagType("");
                      setPostTx({ bpSystolic: "", bpDiastolic: "", bpSite: "", pulse: "", temp: "", method: "", spo2: "", rr: "", rbs: "", weight: "", txHr: "", txMin: "", txL: "", dialysateL: "", ufL: "", blp: "", catheterLock: "", arterialAccess: "", venousAccess: "", ufNet: "", machineDisinfected: true, accessBleeding: "", needleHeld: "", medicalComplaints: "", nonMedicalIncidence: "", initials: "" });
                    }}
                  >
                    <Feather name="refresh-cw" size={16} color="#fff" />
                    <Text style={s.mainBtnText}>Clear</Text>
                  </Pressable>
                  <Pressable
                    style={[s.saveFlowBtn, { backgroundColor: "#EF4444", flex: 1 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert("Print", "Print functionality coming soon.");
                    }}
                  >
                    <Feather name="printer" size={16} color="#fff" />
                    <Text style={s.mainBtnText}>Print</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* ─── Flow Sheet Mobile ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(215).springify()} style={s.section}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <CollapsibleHeader
              title="Flow Sheet Mobile"
              icon="smartphone"
              iconColor="#22C55E"
              badges={[
                { text: "Easy Fill", bg: "#D1FAE5", fg: "#065F46" },
              ]}
              expanded={flowMobileOpen}
              onToggle={() => setFlowMobileOpen(!flowMobileOpen)}
              colors={colors}
            />
            {flowMobileOpen && (() => {
              const roProps = isReadOnly ? { pointerEvents: "none" as const } : {};
              const vitalsComplete = Object.values(mVitals).some((v) => v !== "");
              const machineComplete = mMachine !== "";
              const painComplete = mPain !== "" || Object.values(mPainDetails).some((v) => v !== "");
              const fallComplete = mFallRisk !== "";
              const nursingComplete = mNursingActions.some((r) => Object.values(r).some((v) => v !== ""));
              const dialysisComplete = mDialysisParams.some((r) => Object.values(r).some((v) => v !== ""));
              const intakeComplete = mIntake !== "" || mOutput !== "";
              const carComplete = Object.values(mCar).some((v) => v !== "");
              const accessComplete = mAccess !== "";
              const dialysateComplete = Object.values(mDialysate).some((v) => v !== "");
              const anticoagComplete = mAnticoagType !== "";
              const medsComplete = Object.keys(medAdmin).length > 0;
              const postComplete = Object.values(mPostTx).some((v) => v !== "");

              return (
              <View style={{ padding: 14, gap: 0 }}>

                <Acc id="outside" title="Outside Dialysis" color="#0EA5E9" done={mOutsideDialysis}>
                  <View style={ms.switchRow}>
                    <Text style={[ms.switchLabel, { color: colors.text }]}>Did You Have Outside Dialysis?</Text>
                    <Switch value={mOutsideDialysis} onValueChange={setMOutsideDialysis} trackColor={{ false: colors.border, true: `${Colors.primary}60` }} thumbColor={mOutsideDialysis ? Colors.primary : "#f4f3f4"} />
                  </View>
                </Acc>

                <Acc id="vitals" title="Pre-Treatment Vitals" color="#13A8BD" done={vitalsComplete}>
                  <View style={s.formRow}>
                    <FormField label="Height (Cm)" value={mVitals.height} onChangeText={(v) => updateMVital("height", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="Pre Weight (Kg)" value={mVitals.preWeight} onChangeText={(v) => updateMVital("preWeight", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Dry Weight (Kg)" value={mVitals.dryWeight} onChangeText={(v) => updateMVital("dryWeight", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="UF Goal (Kg)" value={mVitals.ufGoal} onChangeText={(v) => updateMVital("ufGoal", v)} colors={colors} half keyboardType="decimal-pad" />
                  </View>
                  <Text style={[ms.subLabel, { color: colors.text }]}>BP (mmHg)</Text>
                  <View style={s.formRow}>
                    <FormField label="Systolic" value={mVitals.bpSystolic} onChangeText={(v) => updateMVital("bpSystolic", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="Diastolic" value={mVitals.bpDiastolic} onChangeText={(v) => updateMVital("bpDiastolic", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                  <FormField label="Site" value={mBpSite} onChangeText={setMBpSite} colors={colors} placeholder="e.g. Left Arm" />
                  <View style={s.formRow}>
                    <FormField label="Temperature (°C)" value={mVitals.temperature} onChangeText={(v) => updateMVital("temperature", v)} colors={colors} half keyboardType="decimal-pad" />
                    <FormField label="Method" value={mMethod} onChangeText={setMMethod} colors={colors} half placeholder="e.g. Oral" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="SpO2 (%)" value={mVitals.spo2} onChangeText={(v) => updateMVital("spo2", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="RBS (mg/dl)" value={mVitals.rbs} onChangeText={(v) => updateMVital("rbs", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="HR (Bpm)" value={mVitals.hr} onChangeText={(v) => updateMVital("hr", v)} colors={colors} half keyboardType="numeric" />
                    <FormField label="RR (cpm)" value={mVitals.rr} onChangeText={(v) => updateMVital("rr", v)} colors={colors} half keyboardType="numeric" />
                  </View>
                </Acc>

                <Acc id="machines" title="Machines" color="#8B5CF6" done={machineComplete}>
                  <FormField label="Choose Machine" value={mMachine} onChangeText={setMMachine} colors={colors} placeholder="e.g. 49827 | W45832" />
                </Acc>

                <Acc id="pain" title="Pain Assessment" color="#EF4444" done={painComplete}>
                  <View style={s.formRow}>
                    <FormField label="Tool Used" value={mPainDetails.toolUsed} onChangeText={(v) => setMPainDetails({ ...mPainDetails, toolUsed: v })} colors={colors} half />
                    <FormField label="Location" value={mPainDetails.location} onChangeText={(v) => setMPainDetails({ ...mPainDetails, location: v })} colors={colors} half placeholder="Select Location" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Frequency" value={mPainDetails.frequency} onChangeText={(v) => setMPainDetails({ ...mPainDetails, frequency: v })} colors={colors} half placeholder="Select Frequency" />
                    <FormField label="Radiating To" value={mPainDetails.radiatingTo} onChangeText={(v) => setMPainDetails({ ...mPainDetails, radiatingTo: v })} colors={colors} half />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Pain Type" value={mPainDetails.painType} onChangeText={(v) => setMPainDetails({ ...mPainDetails, painType: v })} colors={colors} half placeholder="e.g. Dull / Sharp" />
                    <FormField label="Occurs" value={mPainDetails.occurs} onChangeText={(v) => setMPainDetails({ ...mPainDetails, occurs: v })} colors={colors} half />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Ambulating" value={mPainDetails.ambulating} onChangeText={(v) => setMPainDetails({ ...mPainDetails, ambulating: v })} colors={colors} half />
                    <FormField label="Resting" value={mPainDetails.resting} onChangeText={(v) => setMPainDetails({ ...mPainDetails, resting: v })} colors={colors} half />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Eating" value={mPainDetails.eating} onChangeText={(v) => setMPainDetails({ ...mPainDetails, eating: v })} colors={colors} half />
                    <FormField label="Relieved By" value={mPainDetails.relievedBy} onChangeText={(v) => setMPainDetails({ ...mPainDetails, relievedBy: v })} colors={colors} half />
                  </View>
                  <FormField label="Worsens By" value={mPainDetails.worsensBy} onChangeText={(v) => setMPainDetails({ ...mPainDetails, worsensBy: v })} colors={colors} />
                  <Text style={[ms.subLabel, { color: colors.text }]}>Pain Rating Score (0-10)</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {[...Array(11)].map((_, i) => (
                      <Pressable key={i} onPress={() => setMPain(String(i))} style={[ms.scoreBtn, { backgroundColor: colors.card, borderColor: colors.border }, mPain === String(i) && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                        <Text style={[ms.scoreBtnText, { color: colors.text }, mPain === String(i) && { color: "#fff" }]}>{i}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Acc>

                <Acc id="fall" title="Fall Risk Assessment" color="#F59E0B" done={fallComplete}>
                  <Text style={[ms.subLabel, { color: colors.text }]}>Fall Risk Score</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {[...Array(10)].map((_, i) => (
                      <Pressable
                        key={i}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setMFallRisk(String(i));
                          if (i > 3) {
                            setPhysicianCalled(null);
                            setTimeout(() => setPhysicianModalOpen(true), 150);
                          }
                        }}
                        style={[ms.scoreBtn, { backgroundColor: colors.card, borderColor: colors.border }, mFallRisk === String(i) && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                      >
                        <Text style={[ms.scoreBtnText, { color: colors.text }, mFallRisk === String(i) && { color: "#fff" }]}>{i}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Morse Fall Scale button */}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMorseSheetOpen(true); }}
                    style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F59E0B18", borderWidth: 1.5, borderColor: "#F59E0B", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Feather name="clipboard" size={16} color="#F59E0B" />
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#F59E0B" }}>Morse Fall Scale</Text>
                    </View>
                    {morseComplete
                      ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={{ backgroundColor: morseTotal >= 45 ? "#EF4444" : morseTotal >= 25 ? "#F59E0B" : "#22C55E", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>Score: {morseTotal}</Text>
                          </View>
                          <Feather name="chevron-right" size={14} color="#F59E0B" />
                        </View>
                      : <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#F59E0B" }}>Fill Form</Text>
                          <Feather name="chevron-right" size={14} color="#F59E0B" />
                        </View>
                    }
                  </Pressable>

                  {/* Morse result summary */}
                  {morseComplete && (
                    <View style={{ marginTop: 10, backgroundColor: morseTotal >= 45 ? "#EF444418" : morseTotal >= 25 ? "#F59E0B18" : "#22C55E18", borderRadius: 8, padding: 10 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: morseTotal >= 45 ? "#EF4444" : morseTotal >= 25 ? "#F59E0B" : "#22C55E" }}>
                        {morseTotal >= 45 ? "HIGH RISK" : morseTotal >= 25 ? "MODERATE RISK" : "LOW RISK"} — Total Score: {morseTotal}
                      </Text>
                      {[
                        { label: "A. History of Falling", value: morseA, opts: [{ v: 0, l: "No" }, { v: 25, l: "Yes" }] },
                        { label: "B. Secondary Diagnosis", value: morseB, opts: [{ v: 0, l: "No" }, { v: 15, l: "Yes" }] },
                        { label: "C. Ambulatory Aid", value: morseC, opts: [{ v: 0, l: "None/Nurse assist" }, { v: 15, l: "Crutches/Cane/Walker" }, { v: 30, l: "Furniture" }] },
                        { label: "D. IV Therapy", value: morseD, opts: [{ v: 0, l: "No" }, { v: 20, l: "Yes" }] },
                        { label: "E. Gait / Transfer", value: morseE, opts: [{ v: 0, l: "Normal/Bedrest" }, { v: 10, l: "Weak gait" }, { v: 20, l: "Impaired gait" }] },
                        { label: "F. Mental Status", value: morseF, opts: [{ v: 0, l: "Oriented" }, { v: 15, l: "Forgets limitations" }] },
                      ].map((item) => (
                        <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textSecondary, flex: 1 }}>{item.label}</Text>
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text }}>{item.opts.find((o) => o.v === item.value)?.l ?? ""} ({item.value})</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={[ms.switchRow, { marginTop: 10 }]}>
                    <Text style={[ms.switchLabel, { color: colors.text }]}>High Risk?</Text>
                    <Switch value={mHighFallRisk} onValueChange={setMHighFallRisk} trackColor={{ false: colors.border, true: `${Colors.primary}60` }} thumbColor={mHighFallRisk ? Colors.primary : "#f4f3f4"} />
                  </View>
                  <View style={[ms.noticeBox, { backgroundColor: physicianCalled === "yes" ? "#22C55E18" : physicianCalled === "no" ? "#EF444418" : "#3B82F618" }]}>
                    <Text style={{ color: physicianCalled === "yes" ? "#065F46" : physicianCalled === "no" ? "#B91C1C" : Colors.primary, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                      {physicianCalled === "yes" ? "Physician Notified: Yes" : physicianCalled === "no" ? "Physician Notified: No" : "Physician notification pending"}
                    </Text>
                  </View>
                </Acc>

                <Acc id="nursing" title="Nursing Action" color="#10B981" done={nursingComplete}>
                  {mNursingActions.map((row, idx) => (
                    <View key={idx} style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface, position: "relative" }]}>
                      <FormField label="Time" value={row.time} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], time: v }; setMNursingActions(a); }} colors={colors} placeholder="--:--" />
                      <FormField label="Focus" value={row.focus} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], focus: v }; setMNursingActions(a); }} colors={colors} />
                      <FormField label="Nursing Action" value={row.action} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], action: v }; setMNursingActions(a); }} colors={colors} />
                      <FormField label="Evaluation" value={row.evaluation} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], evaluation: v }; setMNursingActions(a); }} colors={colors} />
                      <FormField label="Name" value={row.name} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], name: v }; setMNursingActions(a); }} colors={colors} />
                      {mNursingActions.length > 1 && (
                        <Pressable onPress={() => setMNursingActions(mNursingActions.filter((_, i) => i !== idx))} style={s.removeRowBtn}>
                          <Feather name="x" size={14} color="#fff" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                  <Pressable style={[s.addRowBtn, { backgroundColor: Colors.primary }]} onPress={() => setMNursingActions([...mNursingActions, { time: "", focus: "", action: "", evaluation: "", name: "" }])}>
                    <Feather name="plus" size={14} color="#fff" />
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add Action</Text>
                  </Pressable>
                </Acc>

                <Acc id="dialysis" title="Dialysis Parameters" color="#3B82F6" done={dialysisComplete}>
                  {mDialysisParams.map((row, idx) => (
                    <View key={idx} style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface, position: "relative" }]}>
                      <FormField label="Time" value={row.time} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], time: v }; setMDialysisParams(a); }} colors={colors} placeholder="--:--" />
                      <Text style={[ms.subLabel, { color: colors.text }]}>Blood Pressure (mmHg)</Text>
                      <View style={s.formRow}>
                        <FormField label="Systolic" value={row.systolic} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], systolic: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                        <FormField label="Diastolic" value={row.diastolic} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], diastolic: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                      </View>
                      <View style={s.formRow}>
                        <FormField label="Site" value={row.site} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], site: v }; setMDialysisParams(a); }} colors={colors} half placeholder="Choose" />
                        <FormField label="Pulse (bpm)" value={row.pulse} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], pulse: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                      </View>
                      <Text style={[ms.subLabel, { color: colors.text }]}>Rates</Text>
                      <View style={s.formRow}>
                        <FormField label="Dialysate (L/hr)" value={row.dialysateRate} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], dialysateRate: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                        <FormField label="UF (L/hr)" value={row.uf} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], uf: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                      </View>
                      <FormField label="BFR (ml/min)" value={row.bfr} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], bfr: v }; setMDialysisParams(a); }} colors={colors} keyboardType="numeric" />
                      <Text style={[ms.subLabel, { color: colors.text }]}>Volumes</Text>
                      <View style={s.formRow}>
                        <FormField label="Dialysate (L/hr)" value={row.dialysateVol} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], dialysateVol: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                        <FormField label="UF (L/hr)" value={row.ufVol} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], ufVol: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                      </View>
                      <Text style={[ms.subLabel, { color: colors.text }]}>Pressures</Text>
                      <View style={s.formRow}>
                        <FormField label="Venous" value={row.venous} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], venous: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                        <FormField label="Effluent" value={row.effluent} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], effluent: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                      </View>
                      <FormField label="Access" value={row.access} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], access: v }; setMDialysisParams(a); }} colors={colors} keyboardType="numeric" />
                      <View style={s.formRow}>
                        <FormField label="Alarms / Comments" value={row.alarms} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], alarms: v }; setMDialysisParams(a); }} colors={colors} half />
                        <FormField label="Initials" value={row.initials} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], initials: v }; setMDialysisParams(a); }} colors={colors} half />
                      </View>
                      {mDialysisParams.length > 1 && (
                        <Pressable onPress={() => setMDialysisParams(mDialysisParams.filter((_, i) => i !== idx))} style={s.removeRowBtn}>
                          <Feather name="x" size={14} color="#fff" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                  <Pressable style={[s.addRowBtn, { backgroundColor: Colors.primary }]} onPress={() => setMDialysisParams([...mDialysisParams, { time: "", systolic: "", diastolic: "", site: "", pulse: "", dialysateRate: "", uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "", access: "", alarms: "", initials: "" }])}>
                    <Feather name="plus" size={14} color="#fff" />
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add Row</Text>
                  </Pressable>
                </Acc>

                <Acc id="alarms" title="Alarms Test" color="#F97316" done={mAlarmsTest}>
                  <View style={[ms.subHeaderBar, { backgroundColor: "#F9731618", borderRadius: 6 }]}>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#9A3412" }}>Alarms Test Passed</Text>
                  </View>
                  <View style={ms.switchRow}>
                    <Text style={[ms.switchLabel, { color: colors.text }]}>Passed?</Text>
                    <Switch value={mAlarmsTest} onValueChange={setMAlarmsTest} trackColor={{ false: colors.border, true: `${Colors.primary}60` }} thumbColor={mAlarmsTest ? Colors.primary : "#f4f3f4"} />
                  </View>
                </Acc>

                <Acc id="intake" title="Intake / Output" color="#06B6D4" done={intakeComplete}>
                  <View style={s.formRow}>
                    <FormField label="Intake (ml)" value={mIntake} onChangeText={setMIntake} colors={colors} half keyboardType="numeric" />
                    <FormField label="Output (ml)" value={mOutput} onChangeText={setMOutput} colors={colors} half keyboardType="numeric" />
                  </View>
                </Acc>

                <Acc id="car" title="CAR" color="#8B5CF6" done={carComplete}>
                  <View style={s.formRow}>
                    <FormField label="FF %" value={mCar.ffPercent} onChangeText={(v) => setMCar({ ...mCar, ffPercent: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="Dialyzer" value={mCar.dialyzer} onChangeText={(v) => setMCar({ ...mCar, dialyzer: v })} colors={colors} half />
                  </View>
                  <FormField label="Temp" value={mCar.temp} onChangeText={(v) => setMCar({ ...mCar, temp: v })} colors={colors} keyboardType="decimal-pad" />
                </Acc>

                <Acc id="access" title="Access / Location" color="#10B981" done={accessComplete}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    {["AVF", "AVG", "CATHETER", "Permacath"].map((opt) => (
                      <Pressable key={opt} onPress={() => setMAccess(opt)} style={[ms.radioBtn, mAccess === opt && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                        <Text style={[ms.radioBtnText, mAccess === opt && { color: "#fff" }]}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Acc>

                <Acc id="dialysate" title="Dialysate" color="#3B82F6" done={dialysateComplete}>
                  <Text style={[ms.subLabel, { color: colors.text }]}>Acetate / Bicarbonate</Text>
                  <View style={s.formRow}>
                    <FormField label="Na" value={mDialysate.na} onChangeText={(v) => setMDialysate({ ...mDialysate, na: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="HCO₃" value={mDialysate.hco3} onChangeText={(v) => setMDialysate({ ...mDialysate, hco3: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="K" value={mDialysate.k} onChangeText={(v) => setMDialysate({ ...mDialysate, k: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="Glucose" value={mDialysate.glucose} onChangeText={(v) => setMDialysate({ ...mDialysate, glucose: v })} colors={colors} half />
                  </View>
                </Acc>

                <Acc id="anticoag" title="Anticoagulation" color="#EF4444" done={anticoagComplete}>
                  <FormField label="Anticoagulation Type" value={mAnticoagType} onChangeText={setMAnticoagType} colors={colors} placeholder="Choose..." />
                </Acc>

                <Acc id="meds" title="Dialysis Medications" color="#0891B2" done={medsComplete}>
                  {MOCK_DIALYSIS_MEDICATIONS.length === 0 ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10, backgroundColor: "#E0F2FE", borderRadius: 6 }}>
                      <Feather name="info" size={14} color="#0284C7" />
                      <Text style={{ color: "#0284C7", fontSize: 12, fontFamily: "Inter_500Medium" }}>No dialysis medications found for this patient.</Text>
                    </View>
                  ) : (
                    MOCK_DIALYSIS_MEDICATIONS.map((med) => {
                      const admin = medAdmin[med.id];
                      return (
                        <View key={med.id} style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>{med.drugName}</Text>
                            {admin?.status && (
                              <View style={{ backgroundColor: admin.status === "yes" ? "#22C55E18" : "#EF444418", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: admin.status === "yes" ? "#22C55E" : "#EF4444" }}>{admin.status === "yes" ? "Administered" : "Not Given"}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>{med.dosage} — {med.route} — {med.frequency}</Text>
                          {!admin?.status && (
                            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                              <Pressable onPress={() => handleMedAction(med.id, "yes")} style={[s.medAdminBtn, { backgroundColor: "#22C55E" }]}>
                                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Yes</Text>
                              </Pressable>
                              <Pressable onPress={() => handleMedAction(med.id, "no")} style={[s.medAdminBtn, { backgroundColor: "#EF4444" }]}>
                                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>No</Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </Acc>

                <Acc id="post" title="Post Treatment Assessment" color="#6366F1" done={postComplete}>
                  <View style={s.formRow}>
                    <FormField label="Post Weight (Kg)" value={mPostTx.postWeight} onChangeText={(v) => setMPostTx({ ...mPostTx, postWeight: v })} colors={colors} half keyboardType="numeric" />
                    <FormField label="Condition" value={mPostTx.condition} onChangeText={(v) => setMPostTx({ ...mPostTx, condition: v })} colors={colors} half placeholder="e.g. Stable" />
                  </View>
                  <View style={s.formRow}>
                    <FormField label="Last BP (mmHg)" value={mPostTx.lastBp} onChangeText={(v) => setMPostTx({ ...mPostTx, lastBp: v })} colors={colors} half />
                    <FormField label="Last Pulse (bpm)" value={mPostTx.lastPulse} onChangeText={(v) => setMPostTx({ ...mPostTx, lastPulse: v })} colors={colors} half keyboardType="numeric" />
                  </View>
                  <FormField label="Notes" value={mPostTx.notes} onChangeText={(v) => setMPostTx({ ...mPostTx, notes: v })} colors={colors} placeholder="Post treatment notes..." />
                  {/* Signature row — Patient & Nurse side by side */}
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    {/* Patient Signature */}
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSignatureConfirmed(patientSigned); setSignatureSheetOpen(true); }}
                      style={{ flex: 1, padding: 12, borderWidth: 1.5, borderColor: patientSigned ? "#22C55E" : Colors.primary, borderRadius: 12, borderStyle: patientSigned ? "solid" : "dashed", backgroundColor: patientSigned ? "#22C55E18" : `${Colors.primary}10`, alignItems: "center", gap: 6 }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: patientSigned ? "#22C55E" : Colors.primary, alignItems: "center", justifyContent: "center" }}>
                        <Feather name={patientSigned ? "check" : "edit-3"} size={16} color="#fff" />
                      </View>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: patientSigned ? "#22C55E" : colors.text, textAlign: "center" }}>Patient{"\n"}Signature</Text>
                      <View style={{ backgroundColor: patientSigned ? "#22C55E" : colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: patientSigned ? "#fff" : colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 10 }}>{patientSigned ? "SIGNED" : "PENDING"}</Text>
                      </View>
                    </Pressable>

                    {/* Nurse Signature */}
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNurseSignatureConfirmed(nurseSigned); setNurseSignatureSheetOpen(true); }}
                      style={{ flex: 1, padding: 12, borderWidth: 1.5, borderColor: nurseSigned ? "#22C55E" : "#8B5CF6", borderRadius: 12, borderStyle: nurseSigned ? "solid" : "dashed", backgroundColor: nurseSigned ? "#22C55E18" : "#8B5CF615", alignItems: "center", gap: 6 }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: nurseSigned ? "#22C55E" : "#8B5CF6", alignItems: "center", justifyContent: "center" }}>
                        <Feather name={nurseSigned ? "check" : "pen-tool"} size={16} color="#fff" />
                      </View>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: nurseSigned ? "#22C55E" : colors.text, textAlign: "center" }}>Nurse{"\n"}Signature</Text>
                      <View style={{ backgroundColor: nurseSigned ? "#22C55E" : colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: nurseSigned ? "#fff" : colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 10 }}>{nurseSigned ? "SIGNED" : "PENDING"}</Text>
                      </View>
                    </Pressable>
                  </View>
                </Acc>

                {/* Save / Clear buttons */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <Pressable
                    style={[s.saveFlowBtn, { backgroundColor: Colors.primary, flex: 1 }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert("Saved", "Flow sheet mobile data saved successfully."); }}
                  >
                    <Feather name="save" size={16} color="#fff" />
                    <Text style={s.mainBtnText}>Save</Text>
                  </Pressable>
                  <Pressable
                    style={[s.saveFlowBtn, { backgroundColor: "#EF4444", flex: 1 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setMVitals({ height: "", preWeight: "", dryWeight: "", ufGoal: "", bpSystolic: "", bpDiastolic: "", temperature: "", spo2: "", hr: "", rr: "", rbs: "" });
                      setMPain(""); setMFallRisk(""); setMIntake(""); setMOutput(""); setMAccess("");
                      setMOutsideDialysis(false); setMAlarmsTest(false); setMHighFallRisk(false);
                      setMBpSite(""); setMMethod(""); setMMachine("");
                      setMNursingActions([{ time: "", focus: "", action: "", evaluation: "", name: "" }]);
                      setMDialysisParams([{ time: "", systolic: "", diastolic: "", site: "", pulse: "", dialysateRate: "", uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "", access: "", alarms: "", initials: "" }]);
                      setMCar({ ffPercent: "", dialyzer: "", temp: "" });
                      setMDialysate({ na: "", hco3: "", k: "", glucose: "" });
                      setMAnticoagType("");
                      setMPostTx({ postWeight: "", lastBp: "", lastPulse: "", condition: "", notes: "" });
                      setMPainDetails({ toolUsed: "", location: "", frequency: "", radiatingTo: "", painType: "", occurs: "", ambulating: "", resting: "", eating: "", relievedBy: "", worsensBy: "" });
                    }}
                  >
                    <Feather name="trash-2" size={16} color="#fff" />
                    <Text style={s.mainBtnText}>Clear</Text>
                  </Pressable>
                </View>
              </View>
              );
            })()}
          </Card>
        </Animated.View>

        {/* ─── Flow Sheet Page (Step-by-Step Wizard) ─────────────────────── */}
        <Animated.View entering={FadeInDown.delay(220).springify()} style={s.section}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <CollapsibleHeader
              title="Flow Sheet Page"
              icon="layers"
              iconColor="#6366F1"
              badges={[
                { text: `Step ${fsPage + 1}/${FS_TOTAL_PAGES}`, bg: "#E0E7FF", fg: "#3730A3" },
              ]}
              expanded={flowPageOpen}
              onToggle={() => setFlowPageOpen(!flowPageOpen)}
              colors={colors}
            />
            {flowPageOpen && (() => {
              const pages = [
                { title: "Outside Dialysis", color: "#0EA5E9", done: mOutsideDialysis },
                { title: "Pre-Treatment Vitals", color: "#13A8BD", done: Object.values(mVitals).some((v) => v !== "") },
                { title: "Machines", color: "#8B5CF6", done: mMachine !== "" },
                { title: "Pain Assessment", color: "#EF4444", done: mPain !== "" || Object.values(mPainDetails).some((v) => v !== "") },
                { title: "Fall Risk Assessment", color: "#F59E0B", done: mFallRisk !== "" },
                { title: "Nursing Action", color: "#10B981", done: mNursingActions.some((r) => Object.values(r).some((v) => v !== "")) },
                { title: "Dialysis Parameters", color: "#3B82F6", done: mDialysisParams.some((r) => Object.values(r).some((v) => v !== "")) },
                { title: "Alarms Test", color: "#F97316", done: mAlarmsTest },
                { title: "Intake / Output", color: "#06B6D4", done: mIntake !== "" || mOutput !== "" },
                { title: "CAR", color: "#8B5CF6", done: Object.values(mCar).some((v) => v !== "") },
                { title: "Access / Location", color: "#10B981", done: mAccess !== "" },
                { title: "Dialysate", color: "#3B82F6", done: Object.values(mDialysate).some((v) => v !== "") },
                { title: "Anticoagulation", color: "#EF4444", done: mAnticoagType !== "" },
                { title: "Dialysis Medications", color: "#0891B2", done: Object.keys(medAdmin).length > 0 },
                { title: "Post Treatment", color: "#6366F1", done: Object.values(mPostTx).some((v) => v !== "") },
              ];
              const pg = pages[fsPage];
              const completedCount = pages.filter((p) => p.done).length;

              return (
              <View style={{ padding: 14 }} pointerEvents={isReadOnly ? "none" : "auto"}>
                {/* Progress Bar */}
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.textSecondary }}>Progress</Text>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary }}>{completedCount}/{FS_TOTAL_PAGES} completed</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.primary, width: `${((fsPage + 1) / FS_TOTAL_PAGES) * 100}%` }} />
                  </View>
                  {/* Step dots */}
                  <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                    {pages.map((p, i) => (
                      <Pressable key={i} onPress={() => setFsPage(i)} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: i === fsPage ? pg.color : p.done ? "#22C55E" : colors.border, alignItems: "center", justifyContent: "center" }}>
                        {p.done && i !== fsPage ? <Feather name="check" size={10} color="#fff" /> : <Text style={{ fontSize: 8, fontFamily: "Inter_700Bold", color: i === fsPage ? "#fff" : colors.textSecondary }}>{i + 1}</Text>}
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Page Title */}
                <View style={[ms.borderedSection, { borderLeftColor: pg.color, marginBottom: 0, backgroundColor: colors.card }]}>
                  <View style={[ms.accHeader, { backgroundColor: `${pg.color}18` }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      {pg.done && <View style={ms.checkCircle}><Feather name="check" size={12} color="#fff" /></View>}
                      <Text style={[ms.accHeaderText, { color: pg.color }]}>{pg.title}</Text>
                    </View>
                    <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: pg.color }}>{fsPage + 1}/{FS_TOTAL_PAGES}</Text>
                  </View>
                  <View style={ms.sectionBody}>

                {/* Page 0: Outside Dialysis */}
                {fsPage === 0 && (
                  <View style={ms.switchRow}>
                    <Text style={[ms.switchLabel, { color: colors.text }]}>Did You Have Outside Dialysis?</Text>
                    <Switch value={mOutsideDialysis} onValueChange={setMOutsideDialysis} trackColor={{ false: colors.border, true: `${Colors.primary}60` }} thumbColor={mOutsideDialysis ? Colors.primary : "#f4f3f4"} />
                  </View>
                )}

                {/* Page 1: Pre-Treatment Vitals */}
                {fsPage === 1 && (
                  <View style={{ gap: 10 }}>
                    <View style={s.formRow}>
                      <FormField label="Height (Cm)" value={mVitals.height} onChangeText={(v) => updateMVital("height", v)} colors={colors} half keyboardType="numeric" />
                      <FormField label="Pre Weight (Kg)" value={mVitals.preWeight} onChangeText={(v) => updateMVital("preWeight", v)} colors={colors} half keyboardType="numeric" />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="Dry Weight (Kg)" value={mVitals.dryWeight} onChangeText={(v) => updateMVital("dryWeight", v)} colors={colors} half keyboardType="numeric" />
                      <FormField label="UF Goal (Kg)" value={mVitals.ufGoal} onChangeText={(v) => updateMVital("ufGoal", v)} colors={colors} half keyboardType="decimal-pad" />
                    </View>
                    <Text style={[ms.subLabel, { color: colors.text }]}>BP (mmHg)</Text>
                    <View style={s.formRow}>
                      <FormField label="Systolic" value={mVitals.bpSystolic} onChangeText={(v) => updateMVital("bpSystolic", v)} colors={colors} half keyboardType="numeric" />
                      <FormField label="Diastolic" value={mVitals.bpDiastolic} onChangeText={(v) => updateMVital("bpDiastolic", v)} colors={colors} half keyboardType="numeric" />
                    </View>
                    <FormField label="Site" value={mBpSite} onChangeText={setMBpSite} colors={colors} placeholder="e.g. Left Arm" />
                    <View style={s.formRow}>
                      <FormField label="Temperature (°C)" value={mVitals.temperature} onChangeText={(v) => updateMVital("temperature", v)} colors={colors} half keyboardType="decimal-pad" />
                      <FormField label="Method" value={mMethod} onChangeText={setMMethod} colors={colors} half placeholder="e.g. Oral" />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="SpO2 (%)" value={mVitals.spo2} onChangeText={(v) => updateMVital("spo2", v)} colors={colors} half keyboardType="numeric" />
                      <FormField label="RBS (mg/dl)" value={mVitals.rbs} onChangeText={(v) => updateMVital("rbs", v)} colors={colors} half keyboardType="numeric" />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="HR (Bpm)" value={mVitals.hr} onChangeText={(v) => updateMVital("hr", v)} colors={colors} half keyboardType="numeric" />
                      <FormField label="RR (cpm)" value={mVitals.rr} onChangeText={(v) => updateMVital("rr", v)} colors={colors} half keyboardType="numeric" />
                    </View>
                  </View>
                )}

                {/* Page 2: Machines */}
                {fsPage === 2 && (
                  <FormField label="Choose Machine" value={mMachine} onChangeText={setMMachine} colors={colors} placeholder="e.g. 49827 | W45832" />
                )}

                {/* Page 3: Pain Assessment */}
                {fsPage === 3 && (
                  <View style={{ gap: 10 }}>
                    <View style={s.formRow}>
                      <FormField label="Tool Used" value={mPainDetails.toolUsed} onChangeText={(v) => setMPainDetails({ ...mPainDetails, toolUsed: v })} colors={colors} half />
                      <FormField label="Location" value={mPainDetails.location} onChangeText={(v) => setMPainDetails({ ...mPainDetails, location: v })} colors={colors} half placeholder="Select Location" />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="Frequency" value={mPainDetails.frequency} onChangeText={(v) => setMPainDetails({ ...mPainDetails, frequency: v })} colors={colors} half placeholder="Select Frequency" />
                      <FormField label="Radiating To" value={mPainDetails.radiatingTo} onChangeText={(v) => setMPainDetails({ ...mPainDetails, radiatingTo: v })} colors={colors} half />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="Pain Type" value={mPainDetails.painType} onChangeText={(v) => setMPainDetails({ ...mPainDetails, painType: v })} colors={colors} half placeholder="e.g. Dull / Sharp" />
                      <FormField label="Occurs" value={mPainDetails.occurs} onChangeText={(v) => setMPainDetails({ ...mPainDetails, occurs: v })} colors={colors} half />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="Ambulating" value={mPainDetails.ambulating} onChangeText={(v) => setMPainDetails({ ...mPainDetails, ambulating: v })} colors={colors} half />
                      <FormField label="Resting" value={mPainDetails.resting} onChangeText={(v) => setMPainDetails({ ...mPainDetails, resting: v })} colors={colors} half />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="Eating" value={mPainDetails.eating} onChangeText={(v) => setMPainDetails({ ...mPainDetails, eating: v })} colors={colors} half />
                      <FormField label="Relieved By" value={mPainDetails.relievedBy} onChangeText={(v) => setMPainDetails({ ...mPainDetails, relievedBy: v })} colors={colors} half />
                    </View>
                    <FormField label="Worsens By" value={mPainDetails.worsensBy} onChangeText={(v) => setMPainDetails({ ...mPainDetails, worsensBy: v })} colors={colors} />
                    <Text style={[ms.subLabel, { color: colors.text }]}>Pain Rating Score (0-10)</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {[...Array(11)].map((_, i) => (
                        <Pressable key={i} onPress={() => setMPain(String(i))} style={[ms.scoreBtn, { backgroundColor: colors.card, borderColor: colors.border }, mPain === String(i) && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                          <Text style={[ms.scoreBtnText, { color: colors.text }, mPain === String(i) && { color: "#fff" }]}>{i}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Page 4: Fall Risk Assessment */}
                {fsPage === 4 && (
                  <View style={{ gap: 10 }}>
                    <Text style={[ms.subLabel, { color: colors.text }]}>Fall Risk Score</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {[...Array(10)].map((_, i) => (
                        <Pressable
                          key={i}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setMFallRisk(String(i));
                            if (i > 3) {
                              setPhysicianCalled(null);
                              setTimeout(() => setPhysicianModalOpen(true), 150);
                            }
                          }}
                          style={[ms.scoreBtn, { backgroundColor: colors.card, borderColor: colors.border }, mFallRisk === String(i) && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                        >
                          <Text style={[ms.scoreBtnText, { color: colors.text }, mFallRisk === String(i) && { color: "#fff" }]}>{i}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={[ms.switchRow, { marginTop: 10 }]}>
                      <Text style={[ms.switchLabel, { color: colors.text }]}>High Risk?</Text>
                      <Switch value={mHighFallRisk} onValueChange={setMHighFallRisk} trackColor={{ false: colors.border, true: `${Colors.primary}60` }} thumbColor={mHighFallRisk ? Colors.primary : "#f4f3f4"} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 }}>See: Fall Risk Screening Form for Dialysis Patient</Text>
                    <View style={[ms.noticeBox, { backgroundColor: physicianCalled === "yes" ? "#22C55E18" : physicianCalled === "no" ? "#EF444418" : "#3B82F618" }]}>
                      <Text style={{ color: physicianCalled === "yes" ? "#065F46" : physicianCalled === "no" ? "#B91C1C" : Colors.primary, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                        {physicianCalled === "yes" ? "Physician Notified: Yes" : physicianCalled === "no" ? "Physician Notified: No" : "Physician notification pending"}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Page 5: Nursing Action */}
                {fsPage === 5 && (
                  <View style={{ gap: 10 }}>
                    {mNursingActions.map((row, idx) => (
                      <View key={idx} style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface, position: "relative" }]}>
                        <FormField label="Time" value={row.time} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], time: v }; setMNursingActions(a); }} colors={colors} placeholder="--:--" />
                        <FormField label="Focus" value={row.focus} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], focus: v }; setMNursingActions(a); }} colors={colors} />
                        <FormField label="Nursing Action" value={row.action} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], action: v }; setMNursingActions(a); }} colors={colors} />
                        <FormField label="Evaluation" value={row.evaluation} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], evaluation: v }; setMNursingActions(a); }} colors={colors} />
                        <FormField label="Name" value={row.name} onChangeText={(v) => { const a = [...mNursingActions]; a[idx] = { ...a[idx], name: v }; setMNursingActions(a); }} colors={colors} />
                        {mNursingActions.length > 1 && (
                          <Pressable onPress={() => setMNursingActions(mNursingActions.filter((_, i) => i !== idx))} style={s.removeRowBtn}>
                            <Feather name="x" size={14} color="#fff" />
                          </Pressable>
                        )}
                      </View>
                    ))}
                    <Pressable style={[s.addRowBtn, { backgroundColor: Colors.primary }]} onPress={() => setMNursingActions([...mNursingActions, { time: "", focus: "", action: "", evaluation: "", name: "" }])}>
                      <Feather name="plus" size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add Action</Text>
                    </Pressable>
                  </View>
                )}

                {/* Page 6: Dialysis Parameters */}
                {fsPage === 6 && (
                  <View style={{ gap: 10 }}>
                    {mDialysisParams.map((row, idx) => (
                      <View key={idx} style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface, position: "relative" }]}>
                        <FormField label="Time" value={row.time} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], time: v }; setMDialysisParams(a); }} colors={colors} placeholder="--:--" />
                        <Text style={[ms.subLabel, { color: colors.text }]}>Blood Pressure (mmHg)</Text>
                        <View style={s.formRow}>
                          <FormField label="Systolic" value={row.systolic} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], systolic: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                          <FormField label="Diastolic" value={row.diastolic} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], diastolic: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                        </View>
                        <View style={s.formRow}>
                          <FormField label="Site" value={row.site} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], site: v }; setMDialysisParams(a); }} colors={colors} half placeholder="Choose" />
                          <FormField label="Pulse (bpm)" value={row.pulse} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], pulse: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                        </View>
                        <Text style={[ms.subLabel, { color: colors.text }]}>Rates</Text>
                        <View style={s.formRow}>
                          <FormField label="Dialysate (L/hr)" value={row.dialysateRate} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], dialysateRate: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                          <FormField label="UF (L/hr)" value={row.uf} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], uf: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                        </View>
                        <FormField label="BFR (ml/min)" value={row.bfr} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], bfr: v }; setMDialysisParams(a); }} colors={colors} keyboardType="numeric" />
                        <Text style={[ms.subLabel, { color: colors.text }]}>Volumes</Text>
                        <View style={s.formRow}>
                          <FormField label="Dialysate (L/hr)" value={row.dialysateVol} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], dialysateVol: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                          <FormField label="UF (L/hr)" value={row.ufVol} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], ufVol: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="decimal-pad" />
                        </View>
                        <Text style={[ms.subLabel, { color: colors.text }]}>Pressures</Text>
                        <View style={s.formRow}>
                          <FormField label="Venous" value={row.venous} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], venous: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                          <FormField label="Effluent" value={row.effluent} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], effluent: v }; setMDialysisParams(a); }} colors={colors} half keyboardType="numeric" />
                        </View>
                        <FormField label="Access" value={row.access} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], access: v }; setMDialysisParams(a); }} colors={colors} keyboardType="numeric" />
                        <View style={s.formRow}>
                          <FormField label="Alarms / Comments" value={row.alarms} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], alarms: v }; setMDialysisParams(a); }} colors={colors} half />
                          <FormField label="Initials" value={row.initials} onChangeText={(v) => { const a = [...mDialysisParams]; a[idx] = { ...a[idx], initials: v }; setMDialysisParams(a); }} colors={colors} half />
                        </View>
                        {mDialysisParams.length > 1 && (
                          <Pressable onPress={() => setMDialysisParams(mDialysisParams.filter((_, i) => i !== idx))} style={s.removeRowBtn}>
                            <Feather name="x" size={14} color="#fff" />
                          </Pressable>
                        )}
                      </View>
                    ))}
                    <Pressable style={[s.addRowBtn, { backgroundColor: Colors.primary }]} onPress={() => setMDialysisParams([...mDialysisParams, { time: "", systolic: "", diastolic: "", site: "", pulse: "", dialysateRate: "", uf: "", bfr: "", dialysateVol: "", ufVol: "", venous: "", effluent: "", access: "", alarms: "", initials: "" }])}>
                      <Feather name="plus" size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add Row</Text>
                    </Pressable>
                  </View>
                )}

                {/* Page 7: Alarms Test */}
                {fsPage === 7 && (
                  <View style={{ gap: 10 }}>
                    <View style={[ms.subHeaderBar, { backgroundColor: "#F9731618", borderRadius: 6 }]}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#9A3412" }}>Alarms Test Passed</Text>
                    </View>
                    <View style={ms.switchRow}>
                      <Text style={[ms.switchLabel, { color: colors.text }]}>Passed?</Text>
                      <Switch value={mAlarmsTest} onValueChange={setMAlarmsTest} trackColor={{ false: colors.border, true: `${Colors.primary}60` }} thumbColor={mAlarmsTest ? Colors.primary : "#f4f3f4"} />
                    </View>
                  </View>
                )}

                {/* Page 8: Intake / Output */}
                {fsPage === 8 && (
                  <View style={s.formRow}>
                    <FormField label="Intake (ml)" value={mIntake} onChangeText={setMIntake} colors={colors} half keyboardType="numeric" />
                    <FormField label="Output (ml)" value={mOutput} onChangeText={setMOutput} colors={colors} half keyboardType="numeric" />
                  </View>
                )}

                {/* Page 9: CAR */}
                {fsPage === 9 && (
                  <View style={{ gap: 10 }}>
                    <View style={s.formRow}>
                      <FormField label="FF %" value={mCar.ffPercent} onChangeText={(v) => setMCar({ ...mCar, ffPercent: v })} colors={colors} half keyboardType="numeric" />
                      <FormField label="Dialyzer" value={mCar.dialyzer} onChangeText={(v) => setMCar({ ...mCar, dialyzer: v })} colors={colors} half />
                    </View>
                    <FormField label="Temp" value={mCar.temp} onChangeText={(v) => setMCar({ ...mCar, temp: v })} colors={colors} keyboardType="decimal-pad" />
                  </View>
                )}

                {/* Page 10: Access / Location */}
                {fsPage === 10 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    {["AVF", "AVG", "CATHETER", "Permacath"].map((opt) => (
                      <Pressable key={opt} onPress={() => setMAccess(opt)} style={[ms.radioBtn, mAccess === opt && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                        <Text style={[ms.radioBtnText, mAccess === opt && { color: "#fff" }]}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Page 11: Dialysate */}
                {fsPage === 11 && (
                  <View style={{ gap: 10 }}>
                    <Text style={[ms.subLabel, { color: colors.text }]}>Acetate / Bicarbonate</Text>
                    <View style={s.formRow}>
                      <FormField label="Na" value={mDialysate.na} onChangeText={(v) => setMDialysate({ ...mDialysate, na: v })} colors={colors} half keyboardType="numeric" />
                      <FormField label="HCO₃" value={mDialysate.hco3} onChangeText={(v) => setMDialysate({ ...mDialysate, hco3: v })} colors={colors} half keyboardType="numeric" />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="K" value={mDialysate.k} onChangeText={(v) => setMDialysate({ ...mDialysate, k: v })} colors={colors} half keyboardType="numeric" />
                      <FormField label="Glucose" value={mDialysate.glucose} onChangeText={(v) => setMDialysate({ ...mDialysate, glucose: v })} colors={colors} half />
                    </View>
                  </View>
                )}

                {/* Page 12: Anticoagulation */}
                {fsPage === 12 && (
                  <FormField label="Anticoagulation Type" value={mAnticoagType} onChangeText={setMAnticoagType} colors={colors} placeholder="Choose..." />
                )}

                {/* Page 13: Dialysis Medications */}
                {fsPage === 13 && (
                  <View style={{ gap: 10 }}>
                    {MOCK_DIALYSIS_MEDICATIONS.length === 0 ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10, backgroundColor: "#E0F2FE", borderRadius: 6 }}>
                        <Feather name="info" size={14} color="#0284C7" />
                        <Text style={{ color: "#0284C7", fontSize: 12, fontFamily: "Inter_500Medium" }}>No dialysis medications found for this patient.</Text>
                      </View>
                    ) : (
                      MOCK_DIALYSIS_MEDICATIONS.map((med) => {
                        const admin = medAdmin[med.id];
                        return (
                          <View key={med.id} style={[s.dynRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>{med.drugName}</Text>
                              {admin?.status && (
                                <View style={{ backgroundColor: admin.status === "yes" ? "#22C55E18" : "#EF444418", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                                  <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: admin.status === "yes" ? "#22C55E" : "#EF4444" }}>{admin.status === "yes" ? "Administered" : "Not Given"}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{med.dosage} — {med.route} — {med.frequency}</Text>
                            {!admin?.status && (
                              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                                <Pressable onPress={() => handleMedAction(med.id, "yes")} style={[s.medAdminBtn, { backgroundColor: "#22C55E" }]}>
                                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>Yes</Text>
                                </Pressable>
                                <Pressable onPress={() => handleMedAction(med.id, "no")} style={[s.medAdminBtn, { backgroundColor: "#EF4444" }]}>
                                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 11 }}>No</Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {/* Page 14: Post Treatment Assessment */}
                {fsPage === 14 && (
                  <View style={{ gap: 10 }}>
                    <View style={s.formRow}>
                      <FormField label="Post Weight (Kg)" value={mPostTx.postWeight} onChangeText={(v) => setMPostTx({ ...mPostTx, postWeight: v })} colors={colors} half keyboardType="numeric" />
                      <FormField label="Condition" value={mPostTx.condition} onChangeText={(v) => setMPostTx({ ...mPostTx, condition: v })} colors={colors} half placeholder="e.g. Stable" />
                    </View>
                    <View style={s.formRow}>
                      <FormField label="Last BP (mmHg)" value={mPostTx.lastBp} onChangeText={(v) => setMPostTx({ ...mPostTx, lastBp: v })} colors={colors} half />
                      <FormField label="Last Pulse (bpm)" value={mPostTx.lastPulse} onChangeText={(v) => setMPostTx({ ...mPostTx, lastPulse: v })} colors={colors} half keyboardType="numeric" />
                    </View>
                    <FormField label="Notes" value={mPostTx.notes} onChangeText={(v) => setMPostTx({ ...mPostTx, notes: v })} colors={colors} placeholder="Post treatment notes..." />
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert("Signature", "Electronic signature captured successfully."); }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, borderStyle: "dashed", marginTop: 4 }}
                    >
                      <Feather name="edit-3" size={16} color={Colors.primary} />
                      <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Click to Sign</Text>
                    </Pressable>
                  </View>
                )}

                  </View>
                </View>

                {/* Navigation Buttons */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <Pressable
                    disabled={fsPage === 0}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFsPage(fsPage - 1); }}
                    style={[s.saveFlowBtn, { backgroundColor: fsPage === 0 ? colors.border : "#64748B", flex: 1 }]}
                  >
                    <Feather name="arrow-left" size={16} color="#fff" />
                    <Text style={s.mainBtnText}>Previous</Text>
                  </Pressable>
                  {fsPage < FS_TOTAL_PAGES - 1 ? (
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFsPage(fsPage + 1); }}
                      style={[s.saveFlowBtn, { backgroundColor: Colors.primary, flex: 1 }]}
                    >
                      <Text style={s.mainBtnText}>Next</Text>
                      <Feather name="arrow-right" size={16} color="#fff" />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert("Saved", "Flow sheet data saved successfully."); }}
                      style={[s.saveFlowBtn, { backgroundColor: "#22C55E", flex: 1 }]}
                    >
                      <Feather name="check-circle" size={16} color="#fff" />
                      <Text style={s.mainBtnText}>Submit</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              );
            })()}
          </Card>
        </Animated.View>

        {/* ─── Patient Inventory (Branch Inventory) ──────────────────────── */}
        <Animated.View entering={FadeInDown.delay(230).springify()} style={s.section}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <CollapsibleHeader
              title="Patient Inventory"
              icon="package"
              iconColor="#8B5CF6"
              expanded={inventoryOpen}
              onToggle={() => setInventoryOpen(!inventoryOpen)}
              colors={colors}
            />
            {inventoryOpen && (
              <View style={{ padding: 12, gap: 8 }} pointerEvents={isReadOnly ? "none" : "auto"}>
                {inventoryItems.map((item) => (
                  <View
                    key={item.id}
                    style={[s.invRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[s.invName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: "Inter_400Regular" }}>
                        # {item.itemNumber}
                      </Text>
                    </View>
                    <View style={{ alignItems: "center", marginRight: 10 }}>
                      <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.primary }}>
                        {item.available}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                        available
                      </Text>
                    </View>
                    <Pressable
                      style={[s.useBtn, { backgroundColor: Colors.primary }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedItem(item);
                        setUseModalVisible(true);
                      }}
                    >
                      <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Use</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </Animated.View>

        {/* ─── Workflow Action Buttons ─────────────────────────────────── */}
        {patientName && (
          <Animated.View entering={FadeInDown.delay(270).springify()} style={s.actionsRow}>
            {visitPhase === "in_progress" && (
              <Pressable
                style={[s.mainBtn, { backgroundColor: Colors.primary }]}
                onPress={handleStartProcedure}
              >
                <Feather name="play" size={18} color="#fff" />
                <Text style={s.mainBtnText}>Start Procedure</Text>
              </Pressable>
            )}
            {visitPhase === "start_procedure" && (
              <Pressable
                style={[s.mainBtn, { backgroundColor: "#EF4444" }]}
                onPress={handleEndProcedure}
              >
                <Feather name="stop-circle" size={18} color="#fff" />
                <Text style={s.mainBtnText}>End Procedure</Text>
              </Pressable>
            )}
            {visitPhase === "end_procedure" && (
              <Pressable
                style={[s.mainBtn, { backgroundColor: "#F59E0B" }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowCheckoutModal(true);
                }}
              >
                <Feather name="log-out" size={18} color="#fff" />
                <Text style={s.mainBtnText}>Check Out</Text>
              </Pressable>
            )}
            {visitPhase === "completed" && (
              <View style={[s.mainBtn, { backgroundColor: "#6B7280" }]}>
                <Feather name="check-circle" size={18} color="#fff" />
                <Text style={s.mainBtnText}>Visit Completed</Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* ─── Morse Fall Scale Bottom Sheet ─────────────────────────────── */}
      <Modal visible={morseSheetOpen} transparent animationType="slide" onRequestClose={() => setMorseSheetOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setMorseSheetOpen(false)} />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: "85%", maxHeight: "95%", flex: 1 }}>
          {/* Drag handle */}
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {/* Sheet header — fixed */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="clipboard" size={18} color="#F59E0B" />
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.text }}>Morse Fall Scale Items</Text>
            </View>
            <Pressable onPress={() => setMorseSheetOpen(false)} style={{ padding: 4 }}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Score row — fixed below header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.textSecondary }}>Total Morse Score</Text>
            <View style={{ backgroundColor: morseTotal >= 45 ? "#EF4444" : morseTotal >= 25 ? "#F59E0B" : "#22C55E", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" }}>{morseTotal}</Text>
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: "#fff" }}>
                {morseTotal >= 45 ? "HIGH RISK" : morseTotal >= 25 ? "MODERATE RISK" : "LOW RISK"}
              </Text>
            </View>
          </View>

          {/* Scrollable form content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {([
              { label: "A. History of Falling (immediate or < 3 months)", state: morseA, setState: setMorseA, options: [{ label: "No", value: 0 }, { label: "Yes", value: 25 }] },
              { label: "B. Secondary Diagnosis", state: morseB, setState: setMorseB, options: [{ label: "No", value: 0 }, { label: "Yes", value: 15 }] },
              { label: "C. Ambulatory Aid", state: morseC, setState: setMorseC, options: [{ label: "None / Bedrest / Nurse assist", value: 0 }, { label: "Crutches / Cane / Walker", value: 15 }, { label: "Furniture", value: 30 }] },
              { label: "D. IV Therapy / Heparin Lock", state: morseD, setState: setMorseD, options: [{ label: "No", value: 0 }, { label: "Yes", value: 20 }] },
              { label: "E. Gait / Transfer", state: morseE, setState: setMorseE, options: [{ label: "Normal / Bedrest / Wheelchair", value: 0 }, { label: "Weak gait", value: 10 }, { label: "Impaired gait", value: 20 }] },
              { label: "F. Mental Status", state: morseF, setState: setMorseF, options: [{ label: "Oriented to own ability", value: 0 }, { label: "Forgets limitations", value: 15 }] },
            ] as Array<{ label: string; state: number | null; setState: (v: number) => void; options: { label: string; value: number }[] }>).map((item) => (
              <View key={item.label} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#F59E0B", marginBottom: 8 }}>{item.label}</Text>
                <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 4, marginBottom: 4 }}>
                  <Text style={{ flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary }}>Option</Text>
                  <Text style={{ width: 50, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>Score</Text>
                  <Text style={{ width: 40, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>Pick</Text>
                </View>
                {item.options.map((opt) => (
                  <Pressable key={opt.value} onPress={() => { Haptics.selectionAsync(); item.setState(opt.value); }} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7 }}>
                    <Text style={{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text }}>{opt.label}</Text>
                    <Text style={{ width: 50, fontFamily: "Inter_500Medium", fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>{opt.value}</Text>
                    <View style={{ width: 40, alignItems: "center" }}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: item.state === opt.value ? Colors.primary : colors.border, backgroundColor: item.state === opt.value ? Colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                        {item.state === opt.value && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}

            {/* Recommended Actions */}
            <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.text, marginBottom: 10 }}>5. Recommended Actions Based on Risk Score</Text>
              {[
                { group: "LOW RISK (0–24)", color: "#22C55E", bg: "#D1FAE5", actions: ["standard_fp", "patient_edu", "safe_env"], labels: { standard_fp: "Standard fall precautions", patient_edu: "Patient education", safe_env: "Safe environment review" } },
                { group: "MODERATE RISK (25–44)", color: "#F59E0B", bg: "#FEF3C7", actions: ["assist_amb", "bed_low", "review_meds", "reassess_24"], labels: { assist_amb: "Assist with ambulation", bed_low: "Keep bed low and locked", review_meds: "Review medications", reassess_24: "Reassess within 24 hours" } },
                { group: "HIGH RISK (≥45)", color: "#EF4444", bg: "#FEE2E2", actions: ["hr_protocol", "bed_alarm", "nurse_mobility", "freq_monitor", "family_edu", "reassess_shift"], labels: { hr_protocol: "High-risk fall protocol", bed_alarm: "Bed alarm if available", nurse_mobility: "Nurse-assisted mobility", freq_monitor: "Frequent monitoring", family_edu: "Family/caregiver education", reassess_shift: "Reassess every shift" } },
              ].map((group) => (
                <View key={group.group} style={{ marginBottom: 10 }}>
                  <View style={{ backgroundColor: group.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 6 }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: group.color }}>{group.group}</Text>
                  </View>
                  {group.actions.map((key) => (
                    <Pressable key={key} onPress={() => { Haptics.selectionAsync(); setMorseActions((p) => ({ ...p, [key]: !p[key] })); }} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 }}>
                      <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: morseActions[key] ? Colors.primary : colors.border, backgroundColor: morseActions[key] ? Colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                        {morseActions[key] && <Feather name="check" size={11} color="#fff" />}
                      </View>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text }}>{(group.labels as any)[key]}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Done button — fixed at bottom */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (morseTotal > 3) {
                  setPhysicianCalled(null);
                  setPendingPhysicianModal(true);
                }
                setMorseSheetOpen(false);
              }}
              style={{ backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Patient Signature Sheet ─────────────────────────────────────── */}
      <Modal visible={signatureSheetOpen} transparent animationType="slide" onRequestClose={() => setSignatureSheetOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setSignatureSheetOpen(false)} />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 16 }}>
          {/* Drag handle */}
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${Colors.primary}20`, alignItems: "center", justifyContent: "center" }}>
                <Feather name="edit-3" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text }}>Patient Signature</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textSecondary }}>Post Treatment Acknowledgement</Text>
              </View>
            </View>
            <Pressable onPress={() => setSignatureSheetOpen(false)} style={{ padding: 4 }}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
            {/* Consent statement */}
            <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.borderLight }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text, marginBottom: 6 }}>Patient Acknowledgement</Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                I acknowledge that I have received the post-treatment assessment and have been informed of my condition and care instructions.
              </Text>
            </View>

            {/* Signature pad area */}
            <View>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>SIGNATURE</Text>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setSignatureConfirmed(true); }}
                style={{ height: 130, borderWidth: 1.5, borderColor: signatureConfirmed ? "#22C55E" : colors.border, borderRadius: 12, borderStyle: signatureConfirmed ? "solid" : "dashed", backgroundColor: signatureConfirmed ? "#F0FDF4" : colors.card, alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {signatureConfirmed
                  ? <>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 28, color: "#22C55E", fontStyle: "italic", letterSpacing: 2 }}>✓ Signed</Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#059669" }}>Tap to re-sign</Text>
                    </>
                  : <>
                      <Feather name="edit-2" size={24} color={colors.textSecondary} />
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary }}>Tap to sign here</Text>
                    </>
                }
              </Pressable>
              {signatureConfirmed && (
                <Pressable onPress={() => { Haptics.selectionAsync(); setSignatureConfirmed(false); }} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, alignSelf: "flex-end" }}>
                  <Feather name="refresh-ccw" size={12} color={colors.textSecondary} />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary }}>Clear signature</Text>
                </Pressable>
              )}
            </View>

            {/* Confirm button */}
            <Pressable
              onPress={() => {
                if (!signatureConfirmed) return;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setPatientSigned(true);
                setSignatureSheetOpen(false);
              }}
              style={{ backgroundColor: signatureConfirmed ? "#22C55E" : colors.border, borderRadius: 13, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 4 }}
            >
              <Feather name="check-circle" size={16} color={signatureConfirmed ? "#fff" : colors.textSecondary} />
              <Text style={{ color: signatureConfirmed ? "#fff" : colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 15 }}>Confirm Signature</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Nurse Signature Sheet ───────────────────────────────────────── */}
      <Modal visible={nurseSignatureSheetOpen} transparent animationType="slide" onRequestClose={() => setNurseSignatureSheetOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setNurseSignatureSheetOpen(false)} />
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 16 }}>
          {/* Drag handle */}
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#8B5CF620", alignItems: "center", justifyContent: "center" }}>
                <Feather name="pen-tool" size={16} color="#8B5CF6" />
              </View>
              <View>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text }}>Nurse Signature</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textSecondary }}>Post Treatment Verification</Text>
              </View>
            </View>
            <Pressable onPress={() => setNurseSignatureSheetOpen(false)} style={{ padding: 4 }}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
            {/* Verification statement */}
            <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.borderLight }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text, marginBottom: 6 }}>Nurse Verification</Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                I verify that I have completed the post-treatment assessment, documented all relevant clinical data, and provided appropriate patient education.
              </Text>
            </View>

            {/* Signature pad area */}
            <View>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>SIGNATURE</Text>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setNurseSignatureConfirmed(true); }}
                style={{ height: 130, borderWidth: 1.5, borderColor: nurseSignatureConfirmed ? "#22C55E" : colors.border, borderRadius: 12, borderStyle: nurseSignatureConfirmed ? "solid" : "dashed", backgroundColor: nurseSignatureConfirmed ? "#F0FDF4" : colors.card, alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {nurseSignatureConfirmed
                  ? <>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 28, color: "#22C55E", fontStyle: "italic", letterSpacing: 2 }}>✓ Verified</Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#059669" }}>Tap to re-sign</Text>
                    </>
                  : <>
                      <Feather name="pen-tool" size={24} color={colors.textSecondary} />
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary }}>Tap to sign here</Text>
                    </>
                }
              </Pressable>
              {nurseSignatureConfirmed && (
                <Pressable onPress={() => { Haptics.selectionAsync(); setNurseSignatureConfirmed(false); }} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, alignSelf: "flex-end" }}>
                  <Feather name="refresh-ccw" size={12} color={colors.textSecondary} />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary }}>Clear signature</Text>
                </Pressable>
              )}
            </View>

            {/* Confirm button */}
            <Pressable
              onPress={() => {
                if (!nurseSignatureConfirmed) return;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setNurseSigned(true);
                setNurseSignatureSheetOpen(false);
              }}
              style={{ backgroundColor: nurseSignatureConfirmed ? "#8B5CF6" : colors.border, borderRadius: 13, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 4 }}
            >
              <Feather name="check-circle" size={16} color={nurseSignatureConfirmed ? "#fff" : colors.textSecondary} />
              <Text style={{ color: nurseSignatureConfirmed ? "#fff" : colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 15 }}>Confirm Signature</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Physician Call Modal ────────────────────────────────────────── */}
      <Modal visible={physicianModalOpen} transparent animationType="fade" onRequestClose={() => setPhysicianModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, width: "100%", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 12 }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${Colors.primary}20`, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="phone-call" size={16} color={Colors.primary} />
                </View>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text }}>You Must Call a Physician</Text>
              </View>
              <Pressable onPress={() => setPhysicianModalOpen(false)} style={{ padding: 4 }}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Body */}
            <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
              {/* Score reminder */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, backgroundColor: "#F59E0B18", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Feather name="alert-triangle" size={14} color="#F59E0B" />
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: "#F59E0B", flex: 1 }}>
                  Fall Risk Score: {mFallRisk || "—"} — Physician notification is required for scores above 3.
                </Text>
              </View>

              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text, marginBottom: 16 }}>Did you call a physician?</Text>

              {/* Radio options */}
              {(["yes", "no"] as const).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => { Haptics.selectionAsync(); setPhysicianCalled(opt); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 4 }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: physicianCalled === opt ? Colors.primary : colors.border, backgroundColor: physicianCalled === opt ? Colors.primary : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {physicianCalled === opt && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#fff" }} />}
                  </View>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.text }}>{opt === "yes" ? "Yes" : "No"}</Text>
                </Pressable>
              ))}
            </View>

            {/* Footer */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
              <Pressable
                onPress={() => {
                  if (!physicianCalled) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setPhysicianModalOpen(false);
                }}
                style={{ backgroundColor: physicianCalled ? Colors.primary : colors.border, borderRadius: 13, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: physicianCalled ? "#fff" : colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 15 }}>Save changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Check Out Confirmation Modal */}
      <Modal visible={showCheckoutModal} transparent animationType="fade">
        <View style={s.checkoutOverlay}>
          <View style={s.checkoutCard}>
            <View style={s.checkoutIconWrap}>
              <Text style={s.checkoutIconText}>!</Text>
            </View>
            <Text style={s.checkoutTitle}>
              Are you sure you want to check out this appointment?
            </Text>
            <View style={s.checkoutBtns}>
              <Pressable
                style={[s.checkoutConfirmBtn, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  setShowCheckoutModal(false);
                  setVisitPhase("completed");
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Text style={s.checkoutBtnText}>Check Out</Text>
              </Pressable>
              <Pressable
                style={[s.checkoutCancelBtn, { backgroundColor: "#EF4444" }]}
                onPress={() => setShowCheckoutModal(false)}
              >
                <Text style={s.checkoutBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
          Alert.alert("Success", `Used ${qty} × ${selectedItem?.name}. Inventory updated.`);
        }}
        colors={colors}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1, gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  topActions: { flexDirection: "row", gap: 8 },

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
  heroActionBtn: { flex: 1 },
  metaRow: { flexDirection: "row", gap: 16, paddingTop: 14, borderTopWidth: 1, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaValue: { fontSize: 13, fontFamily: "Inter_500Medium" },

  checkoutOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  checkoutCard: {
    width: "100%",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: "center",
    gap: 0,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      web: { boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
      default: {},
    }),
  },
  checkoutIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  checkoutIconText: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: "#F59E0B",
    lineHeight: 44,
  },
  checkoutTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 26,
    color: "#111827",
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  checkoutBtns: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  checkoutConfirmBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sectionCard: { padding: 14 },

  rowWithAction: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowIcon: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowValue: { fontSize: 15, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginVertical: 2 },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  teamName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  teamRole: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  notesText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },

  visitInfoGrid: { flexDirection: "row", gap: 8 },
  visitInfoCell: { flex: 1, gap: 4 },
  visitInfoLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.2 },
  visitInfoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  visitInfoDivider: { height: 1, marginVertical: 10 },

  dynRow: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, padding: 10, gap: 8, marginBottom: 8, backgroundColor: "transparent" },
  addRowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  removeRowBtn: { position: "absolute" as const, top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: "#EF4444", alignItems: "center" as const, justifyContent: "center" as const },

  // Collapsible header
  collapsibleHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderBottomWidth: 1 },
  collapsibleTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, minWidth: 22, alignItems: "center" },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },

  // Alert cards
  alertCard: { borderLeftWidth: 4, borderRadius: 8, padding: 12 },
  alertCardTitle: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#EF4444", letterSpacing: 0.5 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  alertRowText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7F1D1D", flex: 1 },
  alertInstrText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#78350F", lineHeight: 20 },

  // Flow Sheet
  flowSection: { gap: 8 },
  flowSectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center", paddingVertical: 8, borderRadius: 8, overflow: "hidden", letterSpacing: 0.3 },
  flowSubTitle: { fontSize: 12, fontFamily: "Inter_700Bold", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, overflow: "hidden", alignSelf: "stretch", letterSpacing: 0.3 },
  formField: { marginTop: 2 },
  formLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  formSubhead: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  formInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, fontFamily: "Inter_400Regular" },
  formRow: { flexDirection: "row", gap: 10 },
  scoreChip: { width: 34, height: 34, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },

  // Radio
  radioRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  radioLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },

  // Medication cards
  medCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  medDrug: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 6 },
  medGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  medCell: { minWidth: "45%" as any, paddingVertical: 2 },
  medCellLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#9CA3AF", letterSpacing: 0.3 },
  medCellVal: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 1 },
  medAdminBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  medAdminBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 8 },

  // Inventory
  invRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1 },
  invName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  useBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },

  procTimeInput: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginTop: 4 },
  procTimeText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  procSaveBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, marginTop: 14 },
  readOnlyBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#6B7280", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  readOnlyBannerText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  saveFlowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 12, gap: 8 },

  // Action
  actionsRow: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  mainBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 15, borderRadius: 14, gap: 8 },
  mainBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", overflow: "hidden" },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  modalHeaderTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  modalHeaderSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  modalItemRow: { flexDirection: "row", gap: 10 },
  modalItemBox: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 12 },
  modalItemLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 6 },
  modalItemName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalItemCode: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  qtyBadge: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  qtyAvailText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  modalUsageBox: { borderRadius: 10, padding: 14 },
  modalUsageTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  qtyInputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  qtyInput: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", paddingVertical: 4 },
  qtyInfo: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 8, paddingHorizontal: 4 },
  modalFooter: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)" },
  modalCancelBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, gap: 6 },
  modalUseBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, gap: 6 },
  modalBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

const ms = StyleSheet.create({
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 4 },
  switchLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  borderedSection: { borderLeftWidth: 3, marginBottom: 10, borderRadius: 10, backgroundColor: "transparent", overflow: "hidden", ...Platform.select({ web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }, default: {} }) },
  majorHeader: { paddingVertical: 10, paddingHorizontal: 14, fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff", textAlign: "center", letterSpacing: 0.3 },
  accHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 14 },
  accHeaderText: { fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 0.3 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  subHeaderBar: { paddingVertical: 8, paddingHorizontal: 14, borderLeftWidth: 0 },
  sectionBody: { padding: 14, gap: 10 },
  subLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  scoreBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" },
  scoreBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#374151" },
  radioBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: "#D1D5DB", backgroundColor: "#F9FAFB" },
  radioBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#374151" },
  noticeBox: { padding: 10, borderRadius: 6, marginTop: 6 },
});
