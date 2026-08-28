import React from "react";
import { Text, View } from "react-native";

import { DateTimeField } from "@/components/ui/DateTimeField";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import {
  computeEndDate,
  drugLabel,
  isFieldVisibleForType,
  type Drug,
  type MedicationOptions,
  type MedicationRowValues,
  type MedicationType,
} from "@/data/models/patientMedication";

import {
  DrugPicker,
  FieldLabel,
  FieldPair,
  MedSelectField,
  MedSelectOrTextField,
  MedTextField,
} from "./MedicationFields";

interface Props {
  values: MedicationRowValues;
  onChange: (next: MedicationRowValues) => void;
  options: MedicationOptions;
  type: MedicationType;
  errors: Record<string, string>;
  colors: any;
  /** Edit mode keeps the drug fixed — swapping it is a new prescription. */
  lockDrug?: boolean;
  disabled?: boolean;
}

/**
 * The medication field set — one row of the add form, or the whole body of
 * the edit sheet. Which fields appear depends only on `type` (§5), and the
 * end date is always read-only: the server recomputes it on save (§6).
 */
export function MedicationRowForm({
  values,
  onChange,
  options,
  type,
  errors,
  colors,
  lockDrug,
  disabled,
}: Props) {
  const set = (patch: Partial<MedicationRowValues>) => onChange({ ...values, ...patch });

  const endPreview = computeEndDate(values.startDate, values.duration, options.indefiniteDurations);

  return (
    <View style={{ gap: 10 }}>
      <DrugPicker
        value={values.drugLabel}
        drugId={values.drugId}
        locked={lockDrug || disabled}
        colors={colors}
        error={errors.drug_id}
        onPick={(drug: Drug) => set({ drugId: drug.id, drugLabel: drugLabel(drug) })}
        onClear={() => set({ drugId: null, drugLabel: "" })}
      />

      <FieldPair>
        <MedSelectField
          label="Form"
          value={values.form}
          options={options.forms}
          onChange={(v) => set({ form: v })}
          required
          error={errors.form}
          disabled={disabled}
        />
        <MedTextField
          label="Dosage"
          value={values.dosage}
          onChange={(v) => set({ dosage: v })}
          colors={colors}
          placeholder="e.g. 40mg"
          required
          error={errors.dosage}
          editable={!disabled}
        />
      </FieldPair>

      <MedSelectOrTextField
        label="Frequency"
        value={values.frequency}
        options={options.frequencies}
        onChange={(v) => set({ frequency: v })}
        required
        error={errors.frequency}
        disabled={disabled}
        colors={colors}
      />

      <FieldPair>
        <MedSelectField
          label="Route"
          value={values.route}
          options={options.routes}
          onChange={(v) => set({ route: v })}
          error={errors.route}
          disabled={disabled}
        />
        <MedSelectField
          label="Duration"
          value={values.duration}
          options={options.durations}
          onChange={(v) => set({ duration: v })}
          error={errors.duration}
          disabled={disabled}
        />
      </FieldPair>

      <FieldPair>
        <View>
          <FieldLabel label="Start date" required colors={colors} />
          <DateTimeField
            mode="date"
            value={values.startDate}
            onChange={(v) => set({ startDate: (v ?? "").slice(0, 10) })}
            colors={colors}
            editable={!disabled}
          />
          {errors.start_date ? (
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#EF4444", marginTop: 3 }}>
              {errors.start_date}
            </Text>
          ) : null}
        </View>
        <View>
          <FieldLabel label="End date" colors={colors} />
          <View
            style={[
              s.formInput,
              { backgroundColor: colors.borderLight, borderColor: colors.border, justifyContent: "center" },
            ]}
          >
            <Text style={{ fontSize: 13.5, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
              {endPreview ?? "No end date"}
            </Text>
          </View>
        </View>
      </FieldPair>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.textTertiary }}>
        End date is calculated from the start date and duration — the server has the final say.
      </Text>

      {/* §5 — Refills is Home-only. */}
      {isFieldVisibleForType("refills", type) ? (
        <MedTextField
          label="Refills"
          value={values.refills}
          onChange={(v) => set({ refills: v.replace(/[^0-9]/g, "") })}
          colors={colors}
          keyboardType="numeric"
          placeholder="0–99"
          error={errors.refills}
          editable={!disabled}
        />
      ) : null}

      {/* §5 — both of these are Dialysis-only. */}
      {isFieldVisibleForType("administration_type", type) ? (
        <MedSelectField
          label="Administration type"
          value={values.administrationType}
          options={options.administrationTypes}
          onChange={(v) => set({ administrationType: v })}
          error={errors.administration_type}
          disabled={disabled}
        />
      ) : null}
      {isFieldVisibleForType("duration_period", type) ? (
        <MedSelectField
          label="Duration period"
          value={values.durationPeriod}
          options={options.durationPeriods}
          onChange={(v) => set({ durationPeriod: v })}
          error={errors.duration_period}
          disabled={disabled}
        />
      ) : null}

      <FieldPair>
        <MedSelectField
          label="Administered by"
          value={values.administeredBy}
          options={options.administeredBy}
          onChange={(v) => set({ administeredBy: v })}
          error={errors.administered_by}
          disabled={disabled}
        />
        <MedTextField
          label="Quantity"
          value={values.quantity}
          onChange={(v) => set({ quantity: v })}
          colors={colors}
          error={errors.quantity}
          editable={!disabled}
        />
      </FieldPair>

      <MedTextField
        label="Instructions"
        value={values.instructions}
        onChange={(v) => set({ instructions: v })}
        colors={colors}
        placeholder="e.g. after food"
        multiline
        error={errors.instructions}
        editable={!disabled}
      />
    </View>
  );
}
