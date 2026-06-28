import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/theme/colors";
import { DateTimeConverter } from "@/utils/datetime";
import type { InventoryItem } from "@/data/models/visit";

interface Props {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  colors: any;
}

export function InventoryHistorySheet({ visible, item, onClose, colors }: Props) {
  const insets = useSafeAreaInsets();

  if (!item) return null;

  const history = item.usageHistory ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: "75%",
          paddingBottom: insets.bottom,
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <Feather name="clock" size={18} color="#8B5CF6" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text }} numberOfLines={1}>
                Usage History
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={{ padding: 4 }}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Summary row */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12, gap: 20, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: item.available > 0 ? Colors.primary : "#EF4444" }}>{item.available}</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary }}>Available</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.text }}>{item.allocated ?? 0}</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary }}>Allocated</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: "#F59E0B" }}>{history.length}</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary }}>Records</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.textTertiary }}># {item.itemNumber}</Text>
          </View>
        </View>

        {/* History list */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10 }}>
          {history.length === 0 ? (
            <Text style={{ textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary, paddingVertical: 30 }}>
              No usage records yet.
            </Text>
          ) : (
            history.map((h, i) => (
              <View
                key={h.id ?? i}
                style={{ backgroundColor: colors.background, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  {/* Qty badge + user */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${Colors.primary}18`, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.primary }}>{h.quantityUsed}</Text>
                    </View>
                    <View>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>{h.user.name}</Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary }}>
                        {h.createdAt ? DateTimeConverter.dateTime(h.createdAt) : "—"}
                      </Text>
                    </View>
                  </View>
                  {/* Old → New total */}
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.textTertiary }}>Total used</Text>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text }}>
                      {h.oldTotal} → {h.newTotal}
                    </Text>
                  </View>
                </View>
                {h.notes ? (
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 2 }}>
                    {h.notes}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
