import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { Colors } from "@/theme/colors";
import { DateTimeConverter } from "@/utils/datetime";
import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

export interface VisualTriageChecklistFormData {
  mrn: string;
  date: string;
  time: string;
  score: string;
  hospital: string;
  national_id: string;
  patient_name: string;
  ad_cough: string;
  ad_fever: string;
  ad_renal: string;
  ad_nausea: string;
  ad_headache: string;
  ad_shortness: string;
  pe_cough: string;
  pe_fever: string;
  pe_renal: string;
  pe_nausea: string;
  pe_headache: string;
  pe_shortness: string;
  total_score: number;
}

const EMPTY: VisualTriageChecklistFormData = {
  mrn: "",
  date: "",
  time: "",
  score: "",
  hospital: "",
  national_id: "",
  patient_name: "",
  ad_cough: "",
  ad_fever: "",
  ad_renal: "",
  ad_nausea: "",
  ad_headache: "",
  ad_shortness: "",
  pe_cough: "",
  pe_fever: "",
  pe_renal: "",
  pe_nausea: "",
  pe_headache: "",
  pe_shortness: "",
  total_score: 0,
};

const SYMPTOMS: { key: string; label: string }[] = [
  { key: "fever", label: "Fever" },
  { key: "cough", label: "Cough" },
  { key: "shortness", label: "Shortness of Breath" },
  { key: "nausea", label: "Nausea" },
  { key: "headache", label: "Headache" },
  { key: "renal", label: "Renal Issues" },
];

export interface VisualTriageHistoryEntry extends VisualTriageChecklistFormData {
  id?: number;
  createdAt?: string;
  authorName?: string;
}

interface Props {
  colors: any;
  isReadOnly: boolean;
  initialExpanded?: boolean;
  initial?: VisualTriageChecklistFormData | null;
  history?: VisualTriageHistoryEntry[];
  isSaving?: boolean;
  onSave: (data: VisualTriageChecklistFormData) => void;
  t: (key: any) => string;
}

export function VisualTriageChecklistForm({
  colors,
  isReadOnly,
  initialExpanded,
  initial,
  history = [],
  isSaving = false,
  onSave,
  t,
}: Props) {
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [data, setData] = useState<VisualTriageChecklistFormData>(() => initial ?? { ...EMPTY });

  useEffect(() => {
    if (!initial) return;
    setData(initial);
  }, [initial]);

  const update = (key: keyof VisualTriageChecklistFormData, value: string | number) =>
    setData((prev) => ({ ...prev, [key]: value }));

  // Auto-compute total_score from all ad_* and pe_* numeric values
  const computedTotal = useMemo(() => {
    const scoreKeys: (keyof VisualTriageChecklistFormData)[] = [
      "ad_cough", "ad_fever", "ad_renal", "ad_nausea", "ad_headache", "ad_shortness",
      "pe_cough", "pe_fever", "pe_renal", "pe_nausea", "pe_headache", "pe_shortness",
    ];
    return scoreKeys.reduce((sum, key) => {
      const val = Number(data[key]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [data]);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({ ...data, total_score: computedTotal });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData({ ...EMPTY });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <CollapsibleHeader
        title={t("visualTriageChecklist")}
        icon="clipboard"
        iconColor="#10B981"
        expanded={open}
        onToggle={() => setOpen(!open)}
        colors={colors}
      />
      <CollapsibleBody
        open={open}
        style={{ padding: 14, gap: 12 }}
        pointerEvents={isReadOnly ? "none" : "auto"}
      >
        {/* Patient & visit info */}
        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Patient Name</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.patient_name}
              onChangeText={(v) => update("patient_name", v)}
              placeholder="Full name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>MRN</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.mrn}
              onChangeText={(v) => update("mrn", v)}
              placeholder="MRN"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>National ID</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.national_id}
              onChangeText={(v) => update("national_id", v)}
              placeholder="National ID"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Hospital</Text>
            <TextInput
              style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={data.hospital}
              onChangeText={(v) => update("hospital", v)}
              placeholder="Hospital name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={s.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Date</Text>
            <DateTimeField
              mode="date"
              value={data.date}
              onChange={(v) => update("date", v)}
              colors={colors}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: colors.text }]}>Time</Text>
            <DateTimeField
              mode="time"
              value={data.time}
              onChange={(v) => update("time", v)}
              colors={colors}
            />
          </View>
        </View>

        {/* Symptom scores table */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
          {/* Table header */}
          <View style={{ flexDirection: "row", backgroundColor: colors.border + "40", paddingVertical: 8, paddingHorizontal: 12 }}>
            <Text style={{ flex: 2, fontSize: 12, fontFamily: "Inter_700Bold", color: colors.text }}>Symptom</Text>
            <Text style={{ flex: 1, fontSize: 12, fontFamily: "Inter_700Bold", color: colors.text, textAlign: "center" }}>
              At Admission
            </Text>
            <Text style={{ flex: 1, fontSize: 12, fontFamily: "Inter_700Bold", color: colors.text, textAlign: "center" }}>
              At Presentation
            </Text>
          </View>

          {SYMPTOMS.map(({ key, label }, idx) => (
            <View
              key={key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: colors.border + "60",
              }}
            >
              <Text style={{ flex: 2, fontSize: 13, fontFamily: "Inter_500Medium", color: colors.text }}>{label}</Text>
              <View style={{ flex: 1, paddingHorizontal: 4 }}>
                <TextInput
                  style={[
                    s.formInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      textAlign: "center",
                      paddingVertical: 6,
                    },
                  ]}
                  value={String(data[`ad_${key}` as keyof VisualTriageChecklistFormData] ?? "")}
                  onChangeText={(v) => update(`ad_${key}` as keyof VisualTriageChecklistFormData, v)}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 4 }}>
                <TextInput
                  style={[
                    s.formInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      textAlign: "center",
                      paddingVertical: 6,
                    },
                  ]}
                  value={String(data[`pe_${key}` as keyof VisualTriageChecklistFormData] ?? "")}
                  onChangeText={(v) => update(`pe_${key}` as keyof VisualTriageChecklistFormData, v)}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}

          {/* Total score row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: `${Colors.primary}12`,
            }}
          >
            <Text style={{ flex: 2, fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.primary }}>
              Total Score
            </Text>
            <View style={{ flex: 2, alignItems: "center" }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 4, backgroundColor: Colors.primary, borderRadius: 8 }}>
                <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" }}>
                  {computedTotal}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Overall score input */}
        <View>
          <Text style={[s.formLabel, { color: colors.text }]}>Score Override</Text>
          <TextInput
            style={[s.formInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            value={data.score}
            onChangeText={(v) => update("score", v)}
            placeholder="Overall score"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <Pressable
            style={[s.saveFlowBtn, { backgroundColor: !isSaving ? Colors.primary : colors.border, flex: 1 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="save" size={16} color="#fff" />
            )}
            <Text style={s.mainBtnText}>{isSaving ? t("saving") : t("save")}</Text>
          </Pressable>
          <Pressable
            style={[s.saveFlowBtn, { backgroundColor: "#EF4444", flex: 1 }]}
            onPress={handleClear}
          >
            <Feather name="trash-2" size={16} color="#fff" />
            <Text style={s.mainBtnText}>{t("clear")}</Text>
          </Pressable>
        </View>

      </CollapsibleBody>

      {/* ── History — outside CollapsibleBody so pointerEvents:"none" doesn't block taps ── */}
      {history.length > 0 && (
        <View style={{ padding: 14, paddingTop: 0, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Feather name="clock" size={13} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.textSecondary }}>
              History ({history.length})
            </Text>
          </View>
          {history.map((entry, idx) => {
            const entryKey = entry.id ?? idx;
            const isExpanded = expandedHistoryId === entryKey;
            const entryTotal = SYMPTOMS.reduce((sum, { key }) => {
              const ad = Number((entry as any)[`ad_${key}`]);
              const pe = Number((entry as any)[`pe_${key}`]);
              return sum + (isNaN(ad) ? 0 : ad) + (isNaN(pe) ? 0 : pe);
            }, 0);
            return (
              <View
                key={entryKey}
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden" }}
              >
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setExpandedHistoryId(isExpanded ? null : (entryKey as number));
                  }}
                  style={{ flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: colors.background, gap: 8 }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${Colors.primary}18`, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.primary }}>{entryTotal}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.text }}>
                      {entry.authorName ? `By ${entry.authorName}` : `Entry #${history.length - idx}`}
                    </Text>
                    {entry.createdAt ? (
                      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>
                        {DateTimeConverter.dateTime(entry.createdAt)}
                      </Text>
                    ) : null}
                  </View>
                  {!isReadOnly && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setData({ ...EMPTY, ...entry });
                        setOpen(true);
                      }}
                      style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: `${Colors.primary}18`, borderRadius: 6 }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.primary }}>Load</Text>
                    </Pressable>
                  )}
                  <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.textSecondary} />
                </Pressable>

                {isExpanded && (
                  <View style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <View style={{ margin: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
                      <View style={{ flexDirection: "row", backgroundColor: colors.border + "40", paddingVertical: 6, paddingHorizontal: 10 }}>
                        <Text style={{ flex: 2, fontSize: 11, fontFamily: "Inter_700Bold", color: colors.text }}>Symptom</Text>
                        <Text style={{ flex: 1, fontSize: 11, fontFamily: "Inter_700Bold", color: colors.text, textAlign: "center" }}>Admission</Text>
                        <Text style={{ flex: 1, fontSize: 11, fontFamily: "Inter_700Bold", color: colors.text, textAlign: "center" }}>Presentation</Text>
                      </View>
                      {SYMPTOMS.map(({ key, label }, i) => (
                        <View
                          key={key}
                          style={{ flexDirection: "row", paddingVertical: 5, paddingHorizontal: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border + "50" }}
                        >
                          <Text style={{ flex: 2, fontSize: 12, fontFamily: "Inter_400Regular", color: colors.text }}>{label}</Text>
                          <Text style={{ flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary, textAlign: "center" }}>
                            {(entry as any)[`ad_${key}`] ?? "—"}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.primary, textAlign: "center" }}>
                            {(entry as any)[`pe_${key}`] ?? "—"}
                          </Text>
                        </View>
                      ))}
                      <View style={{ flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: `${Colors.primary}10` }}>
                        <Text style={{ flex: 2, fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.primary }}>Total</Text>
                        <Text style={{ flex: 2, fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.primary, textAlign: "center" }}>{entryTotal}</Text>
                      </View>
                    </View>
                    {(entry.patient_name || entry.mrn) && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 10, paddingBottom: 10 }}>
                        {entry.patient_name ? <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>Patient: {entry.patient_name}</Text> : null}
                        {entry.mrn ? <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>MRN: {entry.mrn}</Text> : null}
                        {entry.date ? <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>Date: {entry.date}</Text> : null}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
