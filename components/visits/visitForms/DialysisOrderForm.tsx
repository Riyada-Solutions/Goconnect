import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { Card } from "@/components/common/Card";
import { useApp } from "@/context/AppContext";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";
import { Colors } from "@/theme/colors";
import { OfflineQueuedError } from "@/data/offline_api";
import {
  buildDialysisOrderBody,
  labelForOption,
  type DialysisOrder,
  type DialysisOrderFormValues,
} from "@/data/models/dialysisOrder";
import {
  useAcknowledgeDialysisOrder,
  useDeleteDialysisOrder,
  useDialysisOrder,
  useDialysisOrderOptions,
  useDialysisOrders,
  useSaveDialysisOrder,
} from "@/hooks/useDialysisOrders";
import { DateTimeConverter } from "@/utils/datetime";

import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { DialysisOrderSheet } from "./dialysisOrder/DialysisOrderSheet";

interface Props {
  patientId: number;
  /** Tags queued offline mutations so they replay in this visit's order. */
  visitId: number;
  colors: any;
  /** Visit-level lock (completed visit) — orthogonal to the permission rules. */
  isReadOnly: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAcknowledge: boolean;
  initialExpanded?: boolean;
  onSuccess: (message: string) => void;
  onError: (err: unknown) => void;
}

type SheetMode = "create" | "edit" | "view";

/**
 * Dialysis Order — a **history** of orders for the patient, newest first,
 * with the dynamic add/edit form behind it.
 *
 * Writes go through the offline-aware repository, so saving without a
 * connection queues the request and replays it on reconnect, exactly like
 * the other visit forms.
 */
export function DialysisOrderForm({
  patientId,
  visitId,
  colors,
  isReadOnly,
  canEdit,
  canDelete,
  canAcknowledge,
  initialExpanded,
  onSuccess,
  onError,
}: Props) {
  const { t } = useApp();
  const [open, setOpen] = useState(initialExpanded ?? false);
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  // Only fetch once the nurse actually opens the section.
  const { options, isLoading: optionsLoading } = useDialysisOrderOptions(open);
  const ordersQuery = useDialysisOrders(patientId, open);
  const detailQuery = useDialysisOrder(patientId, sheetMode && sheetMode !== "create" ? activeOrderId : null);

  const saveMutation = useSaveDialysisOrder(patientId, visitId);
  const deleteMutation = useDeleteDialysisOrder(patientId, visitId);
  const acknowledgeMutation = useAcknowledgeDialysisOrder(patientId, visitId);

  const orders = useMemo(() => {
    // `useOfflineInfiniteQuery` under-declares its result type (same cast as
    // the patients/visits lists) — the runtime shape is `{ pages: [...] }`.
    const pages = (ordersQuery.data as any)?.pages ?? [];
    return pages.flatMap((p: any) => p.items ?? p.data ?? []) as DialysisOrder[];
  }, [ordersQuery.data]);

  const listedOrder = orders.find((o) => o.id === activeOrderId) ?? null;
  // Prefer the detail payload — only it carries `visibility` and `resolved`.
  const activeOrder = sheetMode === "create" ? null : detailQuery.data ?? listedOrder;

  const typeLabel = (order: DialysisOrder) =>
    labelForOption(options.options?.order_type, order.orderType) || "—";

  const editable = canEdit && !isReadOnly;

  const openSheet = (mode: SheetMode, orderId: number | null) => {
    Haptics.selectionAsync();
    setActiveOrderId(orderId);
    setSheetMode(mode);
  };

  const closeSheet = () => {
    setSheetMode(null);
    setActiveOrderId(null);
  };

  const handleSave = (values: DialysisOrderFormValues, { asNew }: { asNew: boolean }) => {
    const body = buildDialysisOrderBody(options, values);
    saveMutation.mutate(
      { body, orderId: sheetMode === "create" ? undefined : activeOrderId ?? undefined, asNew },
      {
        onSuccess: (result) => {
          closeSheet();
          // §3 — `changed: false` means the server wrote nothing and the
          // nurse acknowledgement still stands. Don't call that a save.
          onSuccess(result.changed ? t("dialysisOrderSaved") : t("dialysisOrderNoChanges"));
        },
        onError: (err) => {
          if (err instanceof OfflineQueuedError) closeSheet();
          onError(err);
        },
      },
    );
  };

  const handleDelete = (order: DialysisOrder) => {
    Alert.alert("Delete order", `Delete dialysis order #${order.id}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteMutation.mutate(order.id, {
            onSuccess: () => onSuccess(t("dialysisOrderDeleted")),
            onError,
          }),
      },
    ]);
  };

  const handleAcknowledge = (order: DialysisOrder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    acknowledgeMutation.mutate(order.id, {
      onSuccess: () => onSuccess(t("dialysisOrderAcknowledged")),
      onError,
    });
  };

  const busy = saveMutation.isPending || deleteMutation.isPending || acknowledgeMutation.isPending;
  const pendingCount = orders.filter((o) => !o.isAcknowledged).length;

  return (
    <>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <CollapsibleHeader
          title={t("dialysisOrderTitle")}
          icon="file-text"
          iconColor="#4F46E5"
          badges={[
            ...(pendingCount > 0
              ? [{ text: `${pendingCount} ${t("pending")}`, bg: "#F59E0B22", fg: "#B45309" }]
              : []),
            ...(isReadOnly || !canEdit
              ? [{ text: t("readOnly"), bg: colors.borderLight, fg: colors.textSecondary }]
              : []),
          ]}
          expanded={open}
          onToggle={() => setOpen(!open)}
          colors={colors}
        />
        <CollapsibleBody open={open} style={{ padding: 14, gap: 10 }}>
          {ordersQuery.isLoading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : orders.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: "center", gap: 6 }}>
              <Feather name="file-text" size={22} color={colors.textTertiary} />
              <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.textSecondary }}>
                {t("dialysisOrderEmpty")}
              </Text>
            </View>
          ) : (
            orders.map((order, index) => (
              <View
                key={order.id}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_700Bold", color: colors.text }}>
                    #{order.id} · {typeLabel(order)}
                  </Text>
                  {/* The newest order is the one in force. */}
                  {index === 0 ? (
                    <View style={[s.badge, { backgroundColor: `${Colors.primary}1A` }]}>
                      <Text style={[s.badgeText, { color: Colors.primary }]}>{t("current")}</Text>
                    </View>
                  ) : null}
                  <View
                    style={[
                      s.badge,
                      { backgroundColor: order.isAcknowledged ? "#10B98122" : "#F59E0B22" },
                    ]}
                  >
                    <Text style={[s.badgeText, { color: order.isAcknowledged ? "#047857" : "#B45309" }]}>
                      {order.isAcknowledged ? t("acknowledged") : t("pending")}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.textSecondary }}>
                  {[
                    order.provider ? `Provider: ${order.provider}` : null,
                    order.isAcknowledged && order.acknowledgedAt
                      ? `Acknowledged ${DateTimeConverter.dateTime(order.acknowledgedAt)}`
                      : null,
                    order.createdAt ? `Created ${DateTimeConverter.date(order.createdAt)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>

                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <RowButton
                    icon={editable ? "edit-2" : "eye"}
                    label={editable ? t("edit") : t("view")}
                    color={Colors.primary}
                    onPress={() => openSheet(editable ? "edit" : "view", order.id)}
                    colors={colors}
                  />
                  {canAcknowledge && !order.isAcknowledged ? (
                    <RowButton
                      icon="check-circle"
                      label={t("acknowledge")}
                      color="#059669"
                      disabled={busy}
                      onPress={() => handleAcknowledge(order)}
                      colors={colors}
                    />
                  ) : null}
                  {/* An acknowledged order can't be deleted — the API answers 400. */}
                  {canDelete && !isReadOnly ? (
                    <RowButton
                      icon="trash-2"
                      label={t("delete")}
                      color="#EF4444"
                      disabled={busy || !order.canDelete}
                      onPress={() => handleDelete(order)}
                      colors={colors}
                    />
                  ) : null}
                </View>
              </View>
            ))
          )}

          {ordersQuery.hasNextPage ? (
            <Pressable
              onPress={() => ordersQuery.fetchNextPage()}
              disabled={ordersQuery.isFetchingNextPage}
              style={{ alignItems: "center", paddingVertical: 10 }}
            >
              {ordersQuery.isFetchingNextPage ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary }}>
                  {t("loadMore")}
                </Text>
              )}
            </Pressable>
          ) : null}

          {editable ? (
            <Pressable
              style={[s.saveFlowBtn, { backgroundColor: Colors.primary }]}
              onPress={() => openSheet("create", null)}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={s.mainBtnText}>{t("dialysisOrderAdd")}</Text>
            </Pressable>
          ) : null}
        </CollapsibleBody>
      </Card>

      <DialysisOrderSheet
        visible={sheetMode !== null}
        onClose={closeSheet}
        options={options}
        optionsLoading={optionsLoading || (sheetMode !== "create" && detailQuery.isLoading)}
        order={activeOrder}
        readOnly={sheetMode === "view" || !editable}
        isSaving={saveMutation.isPending}
        onSave={handleSave}
        colors={colors}
      />
    </>
  );
}

function RowButton({
  icon,
  label,
  color,
  onPress,
  disabled,
  colors,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Feather name={icon as any} size={13} color={color} />
      <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color }}>{label}</Text>
    </Pressable>
  );
}
