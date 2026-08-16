import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { Colors } from "@/theme/colors";

type Answer = "yes" | "no";

interface Props {
  visible: boolean;
  physicianCalled: Answer | null;
  onChange: (v: Answer) => void;
  onSave: () => void;
  onClose: () => void;
  colors: any;
}

export function PhysicianCallModal({ visible, physicianCalled, onChange, onSave, onClose, colors }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            width: "100%",
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${Colors.primary}20`, alignItems: "center", justifyContent: "center" }}>
                <Feather name="phone-call" size={16} color={Colors.primary} />
              </View>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text }}>You Must Call a Physician</Text>
            </View>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, backgroundColor: "#F59E0B18", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Feather name="alert-triangle" size={14} color="#F59E0B" />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: "#F59E0B", flex: 1 }}>
                Fall Risk — Physician notification is required for scores above 3.
              </Text>
            </View>

            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text, marginBottom: 16 }}>
              Did you call a physician?
            </Text>

            {(["yes", "no"] as const).map((opt) => (
              <Pressable
                key={opt}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(opt);
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 4 }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: physicianCalled === opt ? Colors.primary : colors.border,
                    backgroundColor: physicianCalled === opt ? Colors.primary : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {physicianCalled === opt && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#fff" }} />}
                </View>
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.text }}>
                  {opt === "yes" ? "Yes" : "No"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
            <Pressable
              onPress={() => {
                if (!physicianCalled) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSave();
              }}
              style={{
                backgroundColor: physicianCalled ? Colors.primary : colors.border,
                borderRadius: 13,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: physicianCalled ? "#fff" : colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 15 }}>
                Save changes
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
