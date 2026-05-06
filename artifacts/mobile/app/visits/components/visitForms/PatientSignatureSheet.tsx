import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";

interface Props {
  visible: boolean;
  confirmed: boolean;
  onConfirmedChange: (v: boolean) => void;
  onSign: () => void;
  onClose: () => void;
  colors: any;
}

export function PatientSignatureSheet({ visible, confirmed, onConfirmedChange, onSign, onClose, colors }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={onClose} />
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 16 }}>
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>
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
          <Pressable onPress={onClose} style={{ padding: 4 }}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.borderLight }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text, marginBottom: 6 }}>Patient Acknowledgement</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
              I acknowledge that I have received the post-treatment assessment and have been informed of my condition and care instructions.
            </Text>
          </View>

          <View>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>SIGNATURE</Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onConfirmedChange(true);
              }}
              style={{
                height: 130,
                borderWidth: 1.5,
                borderColor: confirmed ? "#22C55E" : colors.border,
                borderRadius: 12,
                borderStyle: confirmed ? "solid" : "dashed",
                backgroundColor: confirmed ? "#F0FDF4" : colors.card,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {confirmed ? (
                <>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 28, color: "#22C55E", fontStyle: "italic", letterSpacing: 2 }}>✓ Signed</Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#059669" }}>Tap to re-sign</Text>
                </>
              ) : (
                <>
                  <Feather name="edit-2" size={24} color={colors.textSecondary} />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary }}>Tap to sign here</Text>
                </>
              )}
            </Pressable>
            {confirmed && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  onConfirmedChange(false);
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, alignSelf: "flex-end" }}
              >
                <Feather name="refresh-ccw" size={12} color={colors.textSecondary} />
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary }}>Clear signature</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => {
              if (!confirmed) return;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSign();
            }}
            style={{
              backgroundColor: confirmed ? "#22C55E" : colors.border,
              borderRadius: 13,
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Feather name="check-circle" size={16} color={confirmed ? "#fff" : colors.textSecondary} />
            <Text style={{ color: confirmed ? "#fff" : colors.textSecondary, fontFamily: "Inter_700Bold", fontSize: 15 }}>Confirm Signature</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
