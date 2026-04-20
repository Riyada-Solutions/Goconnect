import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Colors } from "@/theme/colors";
import { visitDetailStyles as s } from "../../visit-detail.styles";

export type VisitPhase = "in_progress" | "start_procedure" | "end_procedure" | "completed";

interface Props {
  phase: VisitPhase;
  onStartProcedure: () => void;
  onEndProcedure: () => void;
  onCheckOut: () => void;
}

export function WorkflowActionButtons({ phase, onStartProcedure, onEndProcedure, onCheckOut }: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(270).springify()} style={s.actionsRow}>
      {phase === "in_progress" && (
        <Pressable style={[s.mainBtn, { backgroundColor: Colors.primary }]} onPress={onStartProcedure}>
          <Feather name="play" size={18} color="#fff" />
          <Text style={s.mainBtnText}>Start Procedure</Text>
        </Pressable>
      )}
      {phase === "start_procedure" && (
        <Pressable style={[s.mainBtn, { backgroundColor: "#EF4444" }]} onPress={onEndProcedure}>
          <Feather name="stop-circle" size={18} color="#fff" />
          <Text style={s.mainBtnText}>End Procedure</Text>
        </Pressable>
      )}
      {phase === "end_procedure" && (
        <Pressable
          style={[s.mainBtn, { backgroundColor: "#F59E0B" }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCheckOut();
          }}
        >
          <Feather name="log-out" size={18} color="#fff" />
          <Text style={s.mainBtnText}>Check Out</Text>
        </Pressable>
      )}
      {phase === "completed" && (
        <View style={[s.mainBtn, { backgroundColor: "#6B7280" }]}>
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={s.mainBtnText}>Visit Completed</Text>
        </View>
      )}
    </Animated.View>
  );
}
