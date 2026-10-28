import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/components/common/BottomSheet";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/theme/colors";

export type VisitPhase =
  | "in_progress"
  | "start_procedure"
  | "end_procedure"
  | "completed"
  | "reopened"
  | "cancelled";

interface Props {
  phase: VisitPhase;
  canReopen: boolean;
  canStartProcedure?: boolean;
  canEndProcedure?: boolean;
  canCancel?: boolean;
  onStartProcedure: () => void;
  onEndProcedure: () => void;
  onCheckOut: () => void;
  onCheckOutWithoutSap: () => void;
  onClose: () => void;
  onReopen: () => void;
  onCancelVisit: () => void;
  startProcedureLoading?: boolean;
  endProcedureLoading?: boolean;
  checkOutLoading?: boolean;
  checkOutWithoutSapLoading?: boolean;
  closeLoading?: boolean;
  reopenLoading?: boolean;
  cancelLoading?: boolean;
  cancelLabel: string;
}

type FeatherIcon = React.ComponentProps<typeof Feather>["name"];

interface Action {
  key: string;
  label: string;
  icon: FeatherIcon;
  color: string;
  onPress: () => void;
  loading?: boolean;
}

const RED = "#EF4444";
const AMBER = "#F59E0B";
const VIOLET = "#8B5CF6";
const SLATE = "#64748B";

export function WorkflowActionButtons({
  phase,
  canReopen,
  canStartProcedure = true,
  canEndProcedure = true,
  canCancel = true,
  onStartProcedure,
  onEndProcedure,
  onCheckOut,
  onCheckOutWithoutSap,
  onClose,
  onReopen,
  onCancelVisit,
  startProcedureLoading,
  endProcedureLoading,
  checkOutLoading,
  checkOutWithoutSapLoading,
  closeLoading,
  reopenLoading,
  cancelLoading,
  cancelLabel,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  const checkOut: Action = {
    key: "checkout",
    label: "Check Out",
    icon: "log-out",
    color: AMBER,
    onPress: onCheckOut,
    loading: checkOutLoading,
  };
  const withoutSap: Action = {
    key: "no-sap",
    label: "Check Out without SAP",
    icon: "log-out",
    color: SLATE,
    onPress: onCheckOutWithoutSap,
    loading: checkOutWithoutSapLoading,
  };

  // The first action of each phase is the main "next step"; the rest are
  // alternatives. Same rules as the web: an in-progress visit can be checked
  // out directly (skipping the procedure), but once a procedure has started it
  // must be ended first, so checkout is hidden during `start_procedure`.
  const actions: Action[] = [];
  switch (phase) {
    case "in_progress":
      if (canStartProcedure) {
        actions.push({
          key: "start",
          label: "Start Procedure",
          icon: "play",
          color: Colors.primary,
          onPress: onStartProcedure,
          loading: startProcedureLoading,
        });
      }
      actions.push(checkOut, withoutSap);
      break;
    case "start_procedure":
      if (canEndProcedure) {
        actions.push({
          key: "end",
          label: "End Procedure",
          icon: "stop-circle",
          color: RED,
          onPress: onEndProcedure,
          loading: endProcedureLoading,
        });
      }
      break;
    case "end_procedure":
      actions.push(checkOut, withoutSap);
      break;
    case "completed":
      if (canReopen) {
        actions.push({
          key: "reopen",
          label: "Reopen Visit",
          icon: "refresh-cw",
          color: VIOLET,
          onPress: onReopen,
          loading: reopenLoading,
        });
      }
      break;
    case "reopened":
      actions.push(
        {
          key: "close",
          label: "Close Visit",
          icon: "check-circle",
          color: RED,
          onPress: onClose,
          loading: closeLoading,
        },
        withoutSap,
      );
      break;
  }

  // Cancelling is only offered while the visit is still `in_progress`. Once a
  // procedure has been started there is clinical work recorded against the visit,
  // so it must be ended and checked out rather than thrown away.
  const showCancel = canCancel && phase === "in_progress";

  if (actions.length === 0 && !showCancel) return null;

  // One request at a time — every button locks while any of them is in flight.
  const busy = !!(
    startProcedureLoading ||
    endProcedureLoading ||
    checkOutLoading ||
    checkOutWithoutSapLoading ||
    closeLoading ||
    reopenLoading ||
    cancelLoading
  );

  const press = (action: Action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action.onPress();
  };

  // Close the sheet first, then run the action once its slide-out finishes —
  // checkout / cancel open their own modal, and iOS won't stack a second
  // modal on one that is still dismissing.
  const pressFromSheet = (onPress: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetOpen(false);
    setTimeout(onPress, 300);
  };

  const [main, ...rest] = actions;
  const sheetActions: Action[] = [...rest];
  if (showCancel) {
    sheetActions.push({
      key: "cancel",
      label: cancelLabel,
      icon: "x-circle",
      color: RED,
      onPress: onCancelVisit,
      loading: cancelLoading,
    });
  }
  const sheetBusy = sheetActions.some((a) => a.loading);

  return (
    <Animated.View
      entering={FadeInDown.delay(270).springify()}
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: colors.card,
          borderTopColor: colors.borderLight,
        },
      ]}
    >
      {main ? (
        <Pressable
          onPress={() => press(main)}
          disabled={busy}
          style={({ pressed }) => [
            styles.btn,
            styles.mainBtn,
            { backgroundColor: main.color, shadowColor: main.color },
            busy && !main.loading && styles.dimmed,
            pressed && styles.pressed,
          ]}
        >
          {main.loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <View style={styles.mainIcon}>
                <Feather name={main.icon} size={13} color="#fff" />
              </View>
              <Text style={styles.mainText}>{main.label}</Text>
            </>
          )}
        </Pressable>
      ) : null}

      {sheetActions.length > 0 && (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setSheetOpen(true);
          }}
          disabled={busy && !sheetBusy}
          accessibilityLabel="More actions"
          style={({ pressed }) => [
            styles.btn,
            main ? styles.moreBtn : styles.moreBtnWide,
            { backgroundColor: colors.card, borderColor: colors.border },
            busy && !sheetBusy && styles.dimmed,
            pressed && styles.pressed,
          ]}
        >
          {sheetBusy ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <>
              <Feather
                name="more-horizontal"
                size={20}
                color={colors.text}
              />
              {!main && (
                <Text style={[styles.moreText, { color: colors.text }]}>
                  Visit Actions
                </Text>
              )}
            </>
          )}
        </Pressable>
      )}

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Visit Actions"
        maxHeightRatio={0.6}
      >
        <View style={styles.sheetList}>
          {sheetActions.map((action) => {
            const destructive = action.key === "cancel";
            return (
              <React.Fragment key={action.key}>
                {destructive && sheetActions.length > 1 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.borderLight },
                    ]}
                  />
                )}
                <Pressable
                  onPress={() => pressFromSheet(action.onPress)}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    pressed && { backgroundColor: colors.borderLight },
                    busy && styles.dimmed,
                  ]}
                >
                  <View
                    style={[
                      styles.sheetIcon,
                      { backgroundColor: `${action.color}1A` },
                    ]}
                  >
                    <Feather name={action.icon} size={17} color={action.color} />
                  </View>
                  <Text
                    style={[
                      styles.sheetText,
                      { color: destructive ? RED : colors.text },
                    ]}
                  >
                    {action.label}
                  </Text>
                  {!destructive && (
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.textTertiary}
                    />
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>
      </BottomSheet>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Fixed at the bottom of the screen, like a tab bar.
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  btn: {
    minHeight: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  mainBtn: {
    flex: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  mainIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  moreBtn: { width: 46, paddingHorizontal: 0, borderWidth: 1 },
  moreBtnWide: { flex: 1, borderWidth: 1 },
  moreText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sheetList: { paddingHorizontal: 12, paddingTop: 4, gap: 2 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetText: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 6 },
  dimmed: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
