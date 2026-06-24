import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card } from "@/components/common/Card";
import { Colors } from "@/theme/colors";
import type { InventoryItem } from "@/data/models/visit";

import { visitDetailStyles as s } from "../../visit-detail.styles";
import { CollapsibleBody } from "../CollapsibleBody";
import { CollapsibleHeader } from "../CollapsibleHeader";

interface Props {
  items: InventoryItem[];
  expanded: boolean;
  onToggle: () => void;
  onSelectItem: (item: InventoryItem) => void;
  onUseMultiple: () => void;
  isReadOnly: boolean;
  colors: any;
}

export function PatientInventorySection({ items, expanded, onToggle, onSelectItem, onUseMultiple, isReadOnly, colors }: Props) {
  const hasAvailable = items.some((it) => it.available > 0);

  return (
    <Animated.View entering={FadeInDown.delay(230).springify()} style={s.section}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <CollapsibleHeader
          title="Patient Inventory"
          icon="package"
          iconColor="#8B5CF6"
          expanded={expanded}
          onToggle={onToggle}
          colors={colors}
        />
        <CollapsibleBody open={expanded} style={{ padding: 12, gap: 8 }} pointerEvents={isReadOnly ? "none" : "auto"}>
          {items.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingVertical: 20 }}>
              No inventory items assigned.
            </Text>
          ) : (
            <>
              {/* Use Multiple button */}
              {!isReadOnly && hasAvailable && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onUseMultiple();
                  }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 9, marginBottom: 4 }}
                >
                  <Feather name="layers" size={14} color="#fff" />
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Use Multiple Items</Text>
                </Pressable>
              )}

              {items.map((item) => (
                <View key={item.id} style={[s.invRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.invName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: "Inter_400Regular" }}># {item.itemNumber}</Text>
                  </View>
                  <View style={{ alignItems: "center", marginRight: 10 }}>
                    <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: item.available > 0 ? Colors.primary : "#EF4444" }}>{item.available}</Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>available</Text>
                  </View>
                  <Pressable
                    disabled={item.available === 0}
                    style={[s.useBtn, { backgroundColor: item.available === 0 ? colors.border : Colors.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSelectItem(item);
                    }}
                  >
                    <Text style={{ color: item.available === 0 ? colors.textTertiary : "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Use</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </CollapsibleBody>
      </Card>
    </Animated.View>
  );
}
