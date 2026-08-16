import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "@/components/visits/visit-detail.styles";

export type VisitPhase = "in_progress" | "start_procedure" | "end_procedure" | "completed" | "reopened";

interface Props {
  phase: VisitPhase;
  canReopen: boolean;
  canEditProcedure?: boolean;
  onStartProcedure: () => void;
  onEndProcedure: () => void;
  onCheckOut: () => void;
  onCheckOutWithoutSap: () => void;
  onClose: () => void;
  onReopen: () => void;
  startProcedureLoading?: boolean;
  endProcedureLoading?: boolean;
  checkOutLoading?: boolean;
  checkOutWithoutSapLoading?: boolean;
  closeLoading?: boolean;
  reopenLoading?: boolean;
}

export function WorkflowActionButtons({
  phase,
  canReopen,
  canEditProcedure = true,
  onStartProcedure,
  onEndProcedure,
  onCheckOut,
  onCheckOutWithoutSap,
  onClose,
  onReopen,
  startProcedureLoading,
  endProcedureLoading,
  checkOutLoading,
  checkOutWithoutSapLoading,
  closeLoading,
  reopenLoading,
}: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(270).springify()} style={s.actionsRow}>
      {phase === "in_progress" && canEditProcedure && (
        <Pressable
          style={[s.mainBtn, { backgroundColor: Colors.primary, opacity: startProcedureLoading ? 0.7 : 1 }]}
          onPress={onStartProcedure}
          disabled={startProcedureLoading}
        >
          {startProcedureLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="play" size={18} color="#fff" />
              <Text style={s.mainBtnText}>Start Procedure</Text>
            </>
          )}
        </Pressable>
      )}
      {phase === "start_procedure" && canEditProcedure && (
        <Pressable
          style={[s.mainBtn, { backgroundColor: "#EF4444", opacity: endProcedureLoading ? 0.7 : 1 }]}
          onPress={onEndProcedure}
          disabled={endProcedureLoading}
        >
          {endProcedureLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="stop-circle" size={18} color="#fff" />
              <Text style={s.mainBtnText}>End Procedure</Text>
            </>
          )}
        </Pressable>
      )}
      {phase === "end_procedure" && (
        <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
          <Pressable
            style={[s.mainBtn, { backgroundColor: "#F59E0B", flex: 1, opacity: checkOutLoading ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCheckOut();
            }}
            disabled={checkOutLoading || checkOutWithoutSapLoading}
          >
            {checkOutLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="log-out" size={16} color="#fff" />
                <Text style={s.mainBtnText}>Check Out</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[s.mainBtn, { backgroundColor: "#6B7280", flex: 1, opacity: checkOutWithoutSapLoading ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCheckOutWithoutSap();
            }}
            disabled={checkOutLoading || checkOutWithoutSapLoading}
          >
            {checkOutWithoutSapLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="log-out" size={16} color="#fff" />
                <Text style={s.mainBtnText}>Without SAP</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
      {phase === "completed" && canReopen && (
        <Pressable
          style={[s.mainBtn, { backgroundColor: "#8B5CF6", opacity: reopenLoading ? 0.7 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onReopen();
          }}
          disabled={reopenLoading}
        >
          {reopenLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={s.mainBtnText}>Reopen Visit</Text>
            </>
          )}
        </Pressable>
      )}
      {phase === "reopened" && (
        <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
          <Pressable
            style={[s.mainBtn, { backgroundColor: "#EF4444", flex: 1, opacity: closeLoading ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onClose();
            }}
            disabled={closeLoading || checkOutWithoutSapLoading}
          >
            {closeLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="x-circle" size={16} color="#fff" />
                <Text style={s.mainBtnText}>Close Visit</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[s.mainBtn, { backgroundColor: "#6B7280", flex: 1, opacity: checkOutWithoutSapLoading ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCheckOutWithoutSap();
            }}
            disabled={closeLoading || checkOutWithoutSapLoading}
          >
            {checkOutWithoutSapLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="log-out" size={16} color="#fff" />
                <Text style={s.mainBtnText}>Without SAP</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}
