import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/common/Card";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { useApp } from "@/context/AppContext";
import { OfflineQueuedError } from "@/data/offline_api";
import {
  buildCreateMedicationsBody,
  buildUpdateMedicationBody,
  isValidationError,
  parseMedicationErrors,
  type MedicationRowValues,
  type MedicationType,
  type PatientMedication,
} from "@/data/models/patientMedication";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useAdministerMedication,
  useCreatePatientMedications,
  useDeletePatientMedication,
  useMedicationOptions,
  usePatientMedication,
  usePatientMedications,
  useRefillMedication,
  useSetMedicationStatus,
  useUpdatePatientMedication,
} from "@/hooks/usePatientMedications";
import { Colors } from "@/theme/colors";

import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { AddMedicationsSheet } from "./patientMedications/AddMedicationsSheet";
import { EditMedicationSheet } from "./patientMedications/EditMedicationSheet";
import { MedicationCard } from "./patientMedications/MedicationCard";
import { MedicationDetailSheet } from "./patientMedications/MedicationDetailSheet";
import {
  AdministerDoseSheet,
  RefillMedicationSheet,
} from "./patientMedications/MedicationActionSheets";

interface Props {
  patientId: number;
  /** Tags queued offline mutations so they replay in this visit's order. */
  visitId: number;
  colors: any;
  /** Visit-level lock (completed visit) — orthogonal to the permission rules. */
  isReadOnly: boolean;
  canEdit: boolean;
  canRefill: boolean;
  initialExpanded?: boolean;
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

type SheetMode = "add" | "edit" | "detail" | "dose" | "refill";

/**
 * Patient Medications — the patient's home and dialysis prescriptions.
 *
 * Two tabs (one per `type`), an Active and a Deactivated section, and the
 * multi-row add form behind them. Writes go through the offline-aware
 * repository, so saving without a connection queues the request and replays
 * it on reconnect, exactly like the other visit forms.
 */
export function PatientMedicationsForm({
  patientId,
  visitId,
  colors,
  isReadOnly,
  canEdit,
  canRefill,
  initialExpanded,
  onSuccess,
  onError,
}: Props) {
  const { t } = useApp();
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [type, setType] = useState<MedicationType>("home_medications");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300); // §4
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, Record<string, string>>>({});
  const [flatErrors, setFlatErrors] = useState<Record<string, string>>({});

  // Nothing is fetched until the nurse actually opens the section.
  const { options, isLoading: optionsLoading } = useMedicationOptions(open);
  const activeQuery = usePatientMedications(patientId, type, true, debouncedSearch, open);
  const stoppedQuery = usePatientMedications(patientId, type, false, debouncedSearch, open);
  const detailQuery = usePatientMedication(patientId, sheet === "detail" ? activeId : null);

  const createMutation = useCreatePatientMedications(patientId, visitId);
  const updateMutation = useUpdatePatientMedication(patientId, visitId);
  const deleteMutation = useDeletePatientMedication(patientId, visitId);
  const statusMutation = useSetMedicationStatus(patientId, visitId);
  const doseMutation = useAdministerMedication(patientId, visitId);
  const refillMutation = useRefillMedication(patientId, visitId);

  // `useOfflineInfiniteQuery` under-declares its result type (same cast as the
  // patients/visits lists) — the runtime shape is `{ pages: [...] }`.
  const flatten = (query: any): PatientMedication[] => {
    const pages = (query.data as any)?.pages ?? [];
    return pages.flatMap((p: any) => p.items ?? p.data ?? []) as PatientMedication[];
  };

  const activeMeds = useMemo(() => flatten(activeQuery), [activeQuery.data]);
  const stoppedMeds = useMemo(() => flatten(stoppedQuery), [stoppedQuery.data]);

  const editable = canEdit && !isReadOnly;
  const refillable = canRefill && !isReadOnly;

  const listedMed =
    [...activeMeds, ...stoppedMeds].find((m) => m.id === activeId) ?? null;
  // Prefer the detail payload once it lands; the list row keeps the sheet
  // populated in the meantime.
  const activeMed = sheet === "detail" ? detailQuery.data ?? listedMed : listedMed;

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    statusMutation.isPending ||
    doseMutation.isPending ||
    refillMutation.isPending;

  const openSheet = (mode: SheetMode, id: number | null) => {
    Haptics.selectionAsync();
    setRowErrors({});
    setFlatErrors({});
    setActiveId(id);
    setSheet(mode);
  };

  /** Detail → edit / dose / refill keeps the same medication in play. */
  const switchSheet = (mode: SheetMode) => {
    setRowErrors({});
    setFlatErrors({});
    setSheet(mode);
  };

  const closeSheet = () => {
    setSheet(null);
    setActiveId(null);
  };

  /** 422 keeps the sheet open with the messages attached; anything else bubbles. */
  const handleWriteError = (err: unknown, target: "rows" | "flat") => {
    if (err instanceof OfflineQueuedError) {
      closeSheet();
      onError(err);
      return;
    }
    if (isValidationError(err)) {
      const parsed = parseMedicationErrors(err);
      if (target === "rows") setRowErrors(parsed.rows);
      else setFlatErrors({ ...parsed.flat, ...(parsed.rows[0] ?? {}) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    onError(err);
  };

  const handleCreate = (rows: MedicationRowValues[]) => {
    setRowErrors({});
    createMutation.mutate(
      { body: buildCreateMedicationsBody(rows, type, visitId) },
      {
        onSuccess: (saved) => {
          closeSheet();
          onSuccess(
            saved.length > 1 ? `${saved.length} ${t("medicationsSaved")}` : t("medicationSaved"),
          );
        },
        onError: (err) => handleWriteError(err, "rows"),
      },
    );
  };

  const handleUpdate = (values: MedicationRowValues) => {
    if (!activeId) return;
    setFlatErrors({});
    updateMutation.mutate(
      { medicationId: activeId, body: buildUpdateMedicationBody(values, type, visitId) },
      {
        onSuccess: () => {
          closeSheet();
          onSuccess(t("medicationUpdated"));
        },
        onError: (err) => handleWriteError(err, "flat"),
      },
    );
  };

  const handleStatus = (med: PatientMedication, active: boolean) => {
    statusMutation.mutate(
      { medicationId: med.id, active },
      {
        onSuccess: () => {
          closeSheet();
          onSuccess(active ? t("medicationReactivated") : t("medicationStopped"));
        },
        onError,
      },
    );
  };

  const confirmStop = (med: PatientMedication) => {
    Alert.alert(t("medicationStopTitle"), t("medicationStopMessage"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("stop"), style: "destructive", onPress: () => handleStatus(med, false) },
    ]);
  };

  const confirmDelete = (med: PatientMedication) => {
    Alert.alert(t("medicationDeleteTitle"), t("medicationDeleteMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () =>
          deleteMutation.mutate(med.id, {
            onSuccess: () => {
              closeSheet();
              onSuccess(t("medicationDeleted"));
            },
            onError,
          }),
      },
    ]);
  };

  const handleDose = (input: { administeredBy: string; reason?: string }) => {
    if (!activeId) return;
    doseMutation.mutate(
      { medicationId: activeId, ...input },
      {
        onSuccess: () => {
          closeSheet();
          onSuccess(t("medicationDoseRecorded"));
        },
        onError: (err) => {
          if (err instanceof OfflineQueuedError) closeSheet();
          onError(err);
        },
      },
    );
  };

  const handleRefill = (notes?: string) => {
    if (!activeId) return;
    refillMutation.mutate(
      { medicationId: activeId, notes },
      {
        onSuccess: () => {
          closeSheet();
          onSuccess(t("medicationRefilled"));
        },
        onError: (err) => {
          // A 400 here is a business rule ("has not expired yet") — the
          // message from the body is the useful part.
          if (err instanceof OfflineQueuedError) closeSheet();
          onError(err);
        },
      },
    );
  };

  const cardProps = (med: PatientMedication) => ({
    medication: med,
    colors,
    busy,
    canEdit: editable,
    canRefill: refillable,
    onOpen: () => openSheet("detail", med.id),
    onRefill: () => openSheet("refill", med.id),
    onEdit: () => openSheet("edit", med.id),
    onDose: () => openSheet("dose", med.id),
    onStop: () => confirmStop(med),
    onReactivate: () => handleStatus(med, true),
    onDelete: () => confirmDelete(med),
  });

  const searching = debouncedSearch.trim().length > 0;

  return (
    <>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <CollapsibleHeader
          title={t("patientMedicationsTitle")}
          icon="package"
          iconColor="#0891B2"
          badges={[
            ...(activeMeds.length > 0
              ? [{ text: String(activeMeds.length), bg: `${Colors.primary}1A`, fg: Colors.primary }]
              : []),
            ...(isReadOnly || !canEdit
              ? [{ text: t("readOnly"), bg: colors.borderLight, fg: colors.textSecondary }]
              : []),
          ]}
          expanded={open}
          onToggle={() => setOpen(!open)}
          colors={colors}
        />
        <CollapsibleBody open={open} style={{ padding: 14, gap: 12 }}>
          {/* ─── Type switch ─────────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.borderLight,
              borderRadius: 10,
              padding: 3,
            }}
          >
            {(
              [
                ["home_medications", t("medicationsHome")],
                ["dialysis_medications", t("medicationsDialysis")],
              ] as [MedicationType, string][]
            ).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => {
                  Haptics.selectionAsync();
                  setType(value);
                }}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: type === value ? colors.surface : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: type === value ? "Inter_600SemiBold" : "Inter_500Medium",
                    color: type === value ? colors.text : colors.textSecondary,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ─── Search ──────────────────────────────────────────────── */}
          <View
            style={[
              s.formInput,
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="search" size={14} color={colors.textTertiary} />
            <TextInput
              style={{ flex: 1, padding: 0, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.text }}
              value={search}
              onChangeText={setSearch}
              placeholder={t("medicationsSearchPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              autoCorrect={false}
            />
            {search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Feather name="x" size={15} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {/* ─── Active ──────────────────────────────────────────────── */}
          <SectionHeading
            title={t("medicationsActive")}
            count={activeMeds.length}
            colors={colors}
          />

          {activeQuery.isLoading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : activeMeds.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: "center", gap: 8 }}>
              <Feather name="package" size={22} color={colors.textTertiary} />
              <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.textSecondary }}>
                {searching ? t("medicationsNoResults") : t("medicationsEmpty")}
              </Text>
              {searching ? (
                <Pressable onPress={() => setSearch("")} style={{ paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary }}>
                    {t("medicationsClearSearch")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            activeMeds.map((med) => <MedicationCard key={med.id} {...cardProps(med)} />)
          )}

          {activeQuery.hasNextPage ? (
            <LoadMore
              loading={activeQuery.isFetchingNextPage}
              onPress={() => activeQuery.fetchNextPage()}
              label={t("loadMore")}
            />
          ) : null}

          {/* ─── Deactivated — hidden entirely when empty (§9) ───────── */}
          {stoppedMeds.length > 0 ? (
            <>
              <SectionHeading
                title={t("medicationsDeactivated")}
                count={stoppedMeds.length}
                colors={colors}
              />
              {stoppedMeds.map((med) => (
                <MedicationCard key={med.id} {...cardProps(med)} />
              ))}
              {stoppedQuery.hasNextPage ? (
                <LoadMore
                  loading={stoppedQuery.isFetchingNextPage}
                  onPress={() => stoppedQuery.fetchNextPage()}
                  label={t("loadMore")}
                />
              ) : null}
            </>
          ) : null}

          {editable ? (
            <Pressable
              style={[s.saveFlowBtn, { backgroundColor: Colors.primary }]}
              onPress={() => openSheet("add", null)}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("medicationsAdd")}</Text>
            </Pressable>
          ) : null}
        </CollapsibleBody>
      </Card>

      <AddMedicationsSheet
        visible={sheet === "add"}
        onClose={closeSheet}
        options={options}
        optionsLoading={optionsLoading}
        type={type}
        isSaving={createMutation.isPending}
        serverErrors={rowErrors}
        onSave={handleCreate}
        colors={colors}
      />

      <EditMedicationSheet
        visible={sheet === "edit"}
        onClose={closeSheet}
        options={options}
        optionsLoading={optionsLoading}
        medication={activeMed}
        type={type}
        isSaving={updateMutation.isPending}
        serverErrors={flatErrors}
        onSave={handleUpdate}
        colors={colors}
      />

      <MedicationDetailSheet
        visible={sheet === "detail"}
        onClose={closeSheet}
        patientId={patientId}
        medication={activeMed}
        isLoading={detailQuery.isLoading && !listedMed}
        canEdit={editable}
        canRefill={refillable}
        busy={busy}
        onEdit={() => switchSheet("edit")}
        onRefill={() => switchSheet("refill")}
        onDose={() => switchSheet("dose")}
        onStop={() => activeMed && confirmStop(activeMed)}
        colors={colors}
      />

      <AdministerDoseSheet
        visible={sheet === "dose"}
        onClose={closeSheet}
        medication={activeMed}
        options={options}
        isSaving={doseMutation.isPending}
        onSave={handleDose}
        colors={colors}
      />

      <RefillMedicationSheet
        visible={sheet === "refill"}
        onClose={closeSheet}
        medication={activeMed}
        isSaving={refillMutation.isPending}
        onConfirm={handleRefill}
        colors={colors}
      />
    </>
  );
}

function SectionHeading({ title, count, colors }: { title: string; count: number; colors: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Inter_700Bold",
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: colors.textSecondary,
        }}
      >
        {title}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderLight }} />
      <Text style={{ fontSize: 11.5, fontFamily: "Inter_500Medium", color: colors.textTertiary }}>
        {count}
      </Text>
    </View>
  );
}

function LoadMore({
  loading,
  onPress,
  label,
}: {
  loading: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={{ alignItems: "center", paddingVertical: 10 }}>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary }}>{label}</Text>
      )}
    </Pressable>
  );
}
