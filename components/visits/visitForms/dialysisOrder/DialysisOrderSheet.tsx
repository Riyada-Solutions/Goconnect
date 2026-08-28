import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";

import { BottomSheet } from "@/components/common/BottomSheet";
import { KeyboardAwareScrollViewCompat } from "@/components/common/KeyboardAwareScrollViewCompat";
import { CheckboxField } from "@/components/ui/CheckboxField";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import {
  applyDialysisOrderChange,
  applyTpaToggle,
  computeDialysisOrderState,
  dialysisOrderToFormValues,
  emptyDialysisOrderValues,
  toOptionList,
  validateDialysisOrder,
  type DialysisOrder,
  type DialysisOrderFormValues,
  type DialysisOrderOptions,
  type DialysisOrderTpaValues,
} from "@/data/models/dialysisOrder";

import { DynSelect, DynText, FieldPair, NoteBox, SectionLabel } from "./DialysisOrderFields";

/**
 * Display labels for the wire field names. Layout and wording live here;
 * **which** fields appear and **what** they offer always comes from the API
 * payload, never from this file.
 */
const LABELS: Record<string, string> = {
  order_type: "Dialysis Order Type",
  modality: "Modality",
  dry_weight: "Dry Weight (Kg)",
  uf: "UF (L)",
  vascular_access: "Vascular Access Type",
  access_subtype: "Access Subtype",
  access_site: "Access Site",
  needle_gauge: "Needle Gauge",
  dwell_type: "Dwell Type",
  volume_value: "Dwell Value",
  dwell_volume: "Dwell Volume (ML)",
  frequency: "Frequency",
  other_frequency: "Frequency — other",
  duration: "Duration",
  blood_flow_rate: "Blood Flow Rate",
  dialysate_type: "Dialysate Type",
  picar: "Picar",
  lactate_percent: "Lactate %",
  dialysate_sodium: "Dialysate Sodium",
  potassium: "Potassium",
  bicarbonate: "Bicarbonate",
  calcium: "Calcium",
  temperature: "Temperature",
  dialysate_volume: "Dialysate Volume",
  dialyzer_cartridge: "Dialyzer Cartridge",
  electrolyte_sodium: "Sodium",
  electrolyte_potassium: "Potassium",
  electrolyte_calcium: "Calcium",
  electrolyte_glucose: "Glucose",
  dialysate_temperature: "Dialysate Temperature",
  dialysate_bath: "Dialysate Bath",
  dialyzer_type: "Dialyzer Type",
  dialyzer_surface_area: "Surface Area",
  administration_type: "Anticoagulation Type",
  bolus_value: "Bolus",
  hourly_value: "Hourly Maintenance",
  additional_information: "Additional Information",
  tpa_frequency: "TPA Frequency",
  tpa_other_frequency: "TPA frequency — other",
  arterial_line_tpa: "Arterial — TPA 1ml/lumen",
  arterial_line_saline: "Arterial — Saline (ml)",
  venous_line_tpa: "Venous — TPA 1ml/lumen",
  venous_line_saline: "Venous — Saline (ml)",
};

const labelFor = (name: string) =>
  LABELS[name] ?? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Every field the layout below places by hand. Anything the API sends that
 * isn't in here still renders — under "Other fields" — so a new backend
 * field shows up without an app release.
 */
const LAID_OUT_FIELDS = new Set<string>([
  "order_type", "modality", "dry_weight", "uf", "vascular_access", "access_subtype",
  "access_site", "needle_gauge", "dwell_type", "volume_value", "dwell_volume",
  "frequency", "other_frequency", "duration", "blood_flow_rate", "tpa_check",
  "tpa_panel", "tpa_frequency", "tpa_other_frequency", "dialysate_type", "picar",
  "lactate_percent", "dialysate_sodium", "potassium", "bicarbonate", "calcium",
  "temperature", "dialysate_volume", "dialyzer_cartridge", "electrolyte_sodium",
  "electrolyte_potassium", "electrolyte_calcium", "electrolyte_glucose",
  "dialysate_temperature", "dialysate_bath", "dialyzer_type", "dialyzer_surface_area",
  "administration_type", "bolus_value", "hourly_value", "additional_information",
]);

interface Props {
  visible: boolean;
  onClose: () => void;
  options: DialysisOrderOptions;
  optionsLoading?: boolean;
  /** null → a brand-new order. */
  order: DialysisOrder | null;
  readOnly: boolean;
  isSaving: boolean;
  onSave: (values: DialysisOrderFormValues, opts: { asNew: boolean }) => void;
  colors: any;
}

/**
 * The dynamic Dialysis Order form.
 *
 * All 24 rules are evaluated by `computeDialysisOrderState()` on every
 * keystroke; this component only decides where things sit on screen. In
 * read-only mode the server's precomputed `visibility.fields` wins, so a
 * saved order renders exactly as the web app shows it.
 */
export function DialysisOrderSheet({
  visible,
  onClose,
  options,
  optionsLoading,
  order,
  readOnly,
  isSaving,
  onSave,
  colors,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [values, setValues] = useState<DialysisOrderFormValues>(() => emptyDialysisOrderValues());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-seed whenever the sheet opens on a different order (or on "Add").
  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setValues(order ? dialysisOrderToFormValues(options, order) : emptyDialysisOrderValues());
  }, [visible, order, options]);

  const state = useMemo(() => {
    const computed = computeDialysisOrderState(options, values);
    // §6.3 — the view screen needs no logic: trust the server's map.
    const serverFields = readOnly ? order?.visibility?.fields : undefined;
    return serverFields ? { ...computed, visible: { ...computed.visible, ...serverFields } } : computed;
  }, [options, values, readOnly, order]);

  const val = (name: string) => values.fields[name] ?? "";
  const show = (name: string) => state.visible[name] !== false;
  const listFor = (name: string) => state.optionsFor[name] ?? toOptionList(options.options?.[name]);

  const setField = (name: string, next: string) => {
    setValues((prev) => applyDialysisOrderChange(options, prev, name, next));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };
  const setOther = (name: string, next: string) =>
    setValues((prev) => ({ ...prev, other_values: { ...prev.other_values, [name]: next } }));
  const setTpa = (name: keyof DialysisOrderTpaValues, next: string) =>
    setValues((prev) => ({ ...prev, tpa: { ...prev.tpa, [name]: next } }));

  const selectRow = (name: string, opts?: { required?: boolean; label?: string }) => {
    if (!show(name)) return null;
    return (
      <View key={name} style={{ gap: 8 }}>
        <DynSelect
          label={state.labels[name] ?? opts?.label ?? labelFor(name)}
          value={val(name)}
          options={listFor(name)}
          disabledKeys={state.disabledOptions[name]}
          required={opts?.required}
          error={errors[name]}
          disabled={readOnly}
          onChange={(v) => setField(name, v)}
        />
        {state.otherVisible[name] ? (
          <DynText
            label={`${labelFor(name)} — other`}
            value={values.other_values[name] ?? ""}
            onChange={(v) => setOther(name, v)}
            colors={colors}
            placeholder="Type the value"
            editable={!readOnly}
            error={errors[`other_values.${name}`]}
          />
        ) : null}
      </View>
    );
  };

  const textRow = (
    name: string,
    opts?: {
      required?: boolean;
      unit?: string | null;
      keyboardType?: "default" | "numeric" | "decimal-pad";
      multiline?: boolean;
      placeholder?: string;
    },
  ) => {
    if (!show(name)) return null;
    return (
      <DynText
        key={name}
        label={labelFor(name)}
        value={val(name)}
        onChange={(v) => setField(name, v)}
        colors={colors}
        unit={opts?.unit}
        keyboardType={opts?.keyboardType}
        multiline={opts?.multiline}
        required={opts?.required}
        placeholder={opts?.placeholder}
        error={errors[name]}
        editable={!readOnly}
      />
    );
  };

  const handleSave = (asNew: boolean) => {
    const found = validateDialysisOrder(options, values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(values, { asNew });
  };

  const orderTypeList = listFor("order_type");
  // Fields the API knows about, that are currently visible, and that the
  // hand-written layout never places.
  const extraFields = state.showForm
    ? Object.keys(options.options ?? {}).filter((name) => !LAID_OUT_FIELDS.has(name) && show(name))
    : [];

  const title = order ? (readOnly ? `Order #${order.id}` : `Edit Order #${order.id}`) : "New Dialysis Order";

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Dialysis Order" subtitle={title} maxHeightRatio={0.92}>
      {optionsLoading ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          <KeyboardAwareScrollViewCompat
            style={{ maxHeight: windowHeight * 0.62 }}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Rule 1 — until a type is chosen this is the only control on screen. */}
            <DynSelect
              label={labelFor("order_type")}
              value={val("order_type")}
              options={orderTypeList}
              required
              error={errors.order_type}
              disabled={readOnly}
              onChange={(v) => setField("order_type", v)}
            />

            {!state.showForm ? (
              <Text style={{ fontSize: 12.5, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                Choose an order type to continue — the rest of the form depends on it.
              </Text>
            ) : (
              <>
                {selectRow("modality", { required: val("order_type") === "1" })}
                <FieldPair>
                  {textRow("dry_weight", { required: true, keyboardType: "decimal-pad", placeholder: "e.g. 72" })}
                  {textRow("uf", { keyboardType: "decimal-pad" })}
                </FieldPair>

                <SectionLabel title="Vascular access" colors={colors} />
                {selectRow("vascular_access", { required: true })}
                {selectRow("access_subtype")}
                {/* Rule 10 */}
                {show("access_subtype") && state.notes.distal ? (
                  <NoteBox text="Distal access — check placement carefully." colors={colors} />
                ) : null}
                {selectRow("access_site", { required: true })}
                {/* Rule 3 */}
                {selectRow("needle_gauge")}
                {/* Rule 4 */}
                {selectRow("dwell_type")}
                {/* Rules 11–13 */}
                {show("volume_value")
                  ? textRow("volume_value", {
                      unit: state.units.volume_value,
                      keyboardType: state.volumeInput === "number" ? "decimal-pad" : "default",
                    })
                  : null}
                {/* Rule 5 */}
                {show("dwell_volume") ? (
                  <View>
                    <Text style={[s.formLabel, { color: colors.text }]}>{labelFor("dwell_volume")}</Text>
                    <FieldPair>
                      <DynText
                        label="Arterial line"
                        value={values.dwell_volume.arterial}
                        onChange={(v) =>
                          setValues((prev) => ({ ...prev, dwell_volume: { ...prev.dwell_volume, arterial: v } }))
                        }
                        colors={colors}
                        keyboardType="decimal-pad"
                        editable={!readOnly}
                      />
                      <DynText
                        label="Venous line"
                        value={values.dwell_volume.venous}
                        onChange={(v) =>
                          setValues((prev) => ({ ...prev, dwell_volume: { ...prev.dwell_volume, venous: v } }))
                        }
                        colors={colors}
                        keyboardType="decimal-pad"
                        editable={!readOnly}
                      />
                    </FieldPair>
                  </View>
                ) : null}

                <SectionLabel title="Session" colors={colors} />
                <FieldPair>
                  {selectRow("frequency")}
                  {selectRow("duration")}
                </FieldPair>
                {textRow("other_frequency", { unit: "/ week" })}
                {selectRow("blood_flow_rate")}
                {/* Rule 6 */}
                {show("blood_flow_rate") && state.notes.bloodFlowCapped ? (
                  <NoteBox text="Catheter access — capped at 350 mL/min." colors={colors} />
                ) : null}

                {/* Rules 7 & 18 — the whole block disappears on AV access. */}
                {show("tpa_check") ? (
                  <>
                    <SectionLabel title="TPA" colors={colors} />
                    <CheckboxField
                      label="TPA"
                      value={values.tpa_check}
                      disabled={readOnly}
                      onChange={(checked) => setValues((prev) => applyTpaToggle(options, prev, checked))}
                    />
                    {show("tpa_panel") ? (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 12,
                          padding: 12,
                          gap: 10,
                        }}
                      >
                        <FieldPair>
                          <DynText
                            label={labelFor("arterial_line_tpa")}
                            value={values.tpa.arterial_line_tpa}
                            onChange={(v) => setTpa("arterial_line_tpa", v)}
                            colors={colors}
                            keyboardType="decimal-pad"
                            editable={!readOnly}
                          />
                          <DynText
                            label={labelFor("arterial_line_saline")}
                            value={values.tpa.arterial_line_saline}
                            onChange={(v) => setTpa("arterial_line_saline", v)}
                            colors={colors}
                            keyboardType="decimal-pad"
                            editable={!readOnly}
                          />
                        </FieldPair>
                        <FieldPair>
                          <DynText
                            label={labelFor("venous_line_tpa")}
                            value={values.tpa.venous_line_tpa}
                            onChange={(v) => setTpa("venous_line_tpa", v)}
                            colors={colors}
                            keyboardType="decimal-pad"
                            editable={!readOnly}
                          />
                          <DynText
                            label={labelFor("venous_line_saline")}
                            value={values.tpa.venous_line_saline}
                            onChange={(v) => setTpa("venous_line_saline", v)}
                            colors={colors}
                            keyboardType="decimal-pad"
                            editable={!readOnly}
                          />
                        </FieldPair>
                        <DynSelect
                          label={labelFor("tpa_frequency")}
                          value={values.tpa.tpa_frequency}
                          options={listFor("tpa_frequency")}
                          disabled={readOnly}
                          onChange={(v) => setTpa("tpa_frequency", v)}
                        />
                        {/* Rule 19 */}
                        {show("tpa_other_frequency") ? (
                          <DynText
                            label={labelFor("tpa_other_frequency")}
                            value={values.tpa.tpa_other_frequency}
                            onChange={(v) => setTpa("tpa_other_frequency", v)}
                            colors={colors}
                            unit="/ week"
                            editable={!readOnly}
                          />
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : null}

                <SectionLabel title="Dialysate" colors={colors} />
                {selectRow("dialysate_type")}
                {/* Rule 21 */}
                {selectRow("picar")}
                {/* Rule 20 */}
                {selectRow("lactate_percent")}

                {/* Rule 1 — Conventional-only composition. */}
                {show("dialysate_sodium") || show("potassium") || show("temperature") ? (
                  <>
                    <SectionLabel title="Dialysate composition" colors={colors} />
                    <FieldPair>
                      {selectRow("dialysate_sodium")}
                      {selectRow("potassium")}
                    </FieldPair>
                    <FieldPair>
                      {selectRow("bicarbonate")}
                      {selectRow("calcium")}
                    </FieldPair>
                    {selectRow("temperature")}
                  </>
                ) : null}

                {/* Rule 1 — Portable-only settings. */}
                {show("dialysate_volume") || show("dialyzer_cartridge") ? (
                  <>
                    <SectionLabel title="Portable settings" colors={colors} />
                    {selectRow("dialysate_volume")}
                    {selectRow("dialyzer_cartridge")}
                    {/* Rule 23 */}
                    {show("dialyzer_cartridge") && state.notes.cartridgeRestricted ? (
                      <NoteBox text="Dry weight below 20 kg — only “Other” is selectable." colors={colors} />
                    ) : null}
                    <SectionLabel title="Electrolytes" colors={colors} />
                    <FieldPair>
                      {selectRow("electrolyte_sodium")}
                      {selectRow("electrolyte_potassium")}
                    </FieldPair>
                    <FieldPair>
                      {selectRow("electrolyte_calcium")}
                      {selectRow("electrolyte_glucose")}
                    </FieldPair>
                    <FieldPair>
                      {selectRow("dialysate_temperature")}
                      {selectRow("dialysate_bath")}
                    </FieldPair>
                  </>
                ) : null}

                {/* Rule 24 */}
                {show("dialyzer_type") || show("dialyzer_surface_area") ? (
                  <>
                    <SectionLabel title="Dialyzer" colors={colors} />
                    <FieldPair>
                      {selectRow("dialyzer_type")}
                      {selectRow("dialyzer_surface_area")}
                    </FieldPair>
                  </>
                ) : null}

                <SectionLabel title="Anticoagulation" colors={colors} />
                {selectRow("administration_type")}
                {/* Rules 14–17 */}
                {selectRow("bolus_value", {
                  label: state.units.bolus_value
                    ? `${labelFor("bolus_value")} (${state.units.bolus_value})`
                    : undefined,
                })}
                {selectRow("hourly_value")}

                <SectionLabel title="Notes" colors={colors} />
                {textRow("additional_information", { multiline: true })}

                {extraFields.length > 0 ? (
                  <>
                    <SectionLabel title="Other fields" colors={colors} />
                    {extraFields.map((name) => selectRow(name))}
                  </>
                ) : null}
              </>
            )}
          </KeyboardAwareScrollViewCompat>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
            }}
          >
            <Pressable
              style={[s.saveFlowBtn, { flex: 1, backgroundColor: colors.borderLight }]}
              onPress={onClose}
            >
              <Text style={[s.mainBtnText, { color: colors.text }]}>Close</Text>
            </Pressable>
            {!readOnly && order ? (
              <Pressable
                style={[s.saveFlowBtn, { flex: 1.2, backgroundColor: "#7C3AED", opacity: isSaving ? 0.6 : 1 }]}
                onPress={() => handleSave(true)}
                disabled={isSaving}
              >
                <Feather name="copy" size={15} color="#fff" />
                <Text style={s.mainBtnText}>Save as New</Text>
              </Pressable>
            ) : null}
            {!readOnly ? (
              <Pressable
                style={[s.saveFlowBtn, { flex: 1.2, backgroundColor: Colors.primary, opacity: isSaving ? 0.6 : 1 }]}
                onPress={() => handleSave(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="save" size={15} color="#fff" />
                )}
                <Text style={s.mainBtnText}>{isSaving ? "Saving…" : "Save"}</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </BottomSheet>
  );
}
